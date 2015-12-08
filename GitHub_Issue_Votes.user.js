// ==UserScript==
// @name           GitHub: Issue Votes
// @namespace      https://github.com/MichaelSp/github-issue-votes.user.js
// @description    A user script to display user votes when browsing Github issues.
// @include        https://github.com/*/*/issues
// @include        https://github.com/*/*/issues/*
// @include        https://github.com/*/*/pull/*
// @run-at         document-end
// @grant          none
// @icon           http://skratchdot.com/favicon.ico
// @downloadURL    https://github.com/MichaelSp/github-issue-votes.user.js/raw/master/GitHub_Issue_Votes.user.js
// @updateURL      https://github.com/MichaelSp/github-issue-votes.user.js/raw/master/GitHub_Issue_Votes.user.js
// @version        1.10
// ==/UserScript==

/*global jQuery */
/*jslint browser: true */

(function () {
    'use strict';
    function addGlobalStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }

    addGlobalStyle('\
    .vote_positive.timeline-comment-wrapper > .timeline-comment .timeline-comment-header, .vote_positive.timeline-comment-wrapper > .timeline-comment .timeline-comment-header .author { background-color: #6CC644; color: #FFF; }\
    .vote_negative.timeline-comment-wrapper > .timeline-comment .timeline-comment-header, .vote_negative.timeline-comment-wrapper > .timeline-comment .timeline-comment-header .author { background-color: #BD2C00; color: #FFF; }\
    .vote_positive.timeline-comment-wrapper > .timeline-comment:after { border-right-color: #6CC644; }\
    .vote_negative.timeline-comment-wrapper > .timeline-comment:after { border-right-color: #BD2C00; }\
    .vote_positive .timeline-comment-action:hover, .vote_negative .timeline-comment-action:hover { color: #FFF; }\
    ');

    var scanForVotes = function () {
        var positive = new Set();
        var negative = new Set();
        jQuery('.comment-body').each(function () {
            var elem = jQuery(this);
            var plainVote, name, imageVoteUp, contextVote, only_p = undefined;
            try {
                name = elem.parents('.timeline-comment-wrapper').find('>a').attr('href').replace(/^\//, '@');
                imageVoteUp = elem.find('img[alt=":+1:"], img[alt=":thumbsup:"]');
                contextVote = /(^|\W)\+1($|\b)/.test(elem.text());
                if (contextVote || imageVoteUp.length) {
                    elem.parents('.timeline-comment-wrapper').addClass('vote_positive').removeClass('vote_negative');
                    positive.add(name);
                    negative.delete(name);
                    only_p = elem.find('> p:only-child');
                    plainVote = /^\s*(\+1|:\+1:)\s*$/.exec(only_p.text()) || [];
                    var collapse = plainVote.length>0 || only_p.find('> img:only-child').length>0;
                    if (collapse) {
                        var hint = plainVote.length > 0 ? plainVote[0] : elem.find('img').wrap('<div/>').parent().html();
                        var comment = elem.parents('.comment');
                        var header = comment.find('.timeline-comment-header-text');
                        header.html(header.html().replace(/commented/, 'voted (' + hint + ')'));
                        comment.find('.comment-content').remove();
                    }
                }
                else if (/(^|\W)-1($|\b)/.test(elem.text()) || elem.find('img[alt=":-1:"], img[alt=":thumbsdown:"]').length>0) {
                    elem.parents('.timeline-comment-wrapper').addClass('vote_negative').removeClass('vote_positive');
                    negative.add(name);
                    positive.delete(name);
                }
            }
            catch(e){}
        });
        return {positive: positive, negative: negative};
    };

    var addVoteSection = function(voters) {
        var names = Array.from(voters.positive).join(',\n');
        var votesHTML = '<div class="discussion-sidebar-item sidebar-votes js-discussion-sidebar-item"> \
            <h3 class="discussion-sidebar-heading"> \
                Votes \
            </h3> \
            <div class="issues css-truncate">';
        var add = '<span id="votes_counter" class="counter" title="'+names+'">+'+voters.positive.size+'</span>';
        var neg = '<span id="votes_counter" class="counter" title="'+names+'">-'+voters.negative.size+'</span>';
        var abs = '<span id="votes_counter" class="counter" title="'+names+'">'+(voters.positive.size-voters.negative.size)+'</span>';
        votesHTML += (voters.positive.size+voters.negative.size) == 0 ? 'None yet' : add + neg + "=" +abs;
        votesHTML += '</div></div>';
        jQuery('.discussion-sidebar-item.sidebar-labels').before(votesHTML);
    };

    var init = function () {
        var voters = scanForVotes();
        addVoteSection(voters);
    };

    jQuery(document).ready(function () {
        jQuery(document).on('pjax:end', function (event) {
            init();
        });
        init();
    });
}());
