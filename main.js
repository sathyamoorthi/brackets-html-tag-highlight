/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets*/

define(function (require, exports, module) {
    "use strict";

    var em = brackets.getModule("editor/EditorManager");
    var highlightColor = "#DFDFDF";

    function listenCursorActivity() {

        var activeEditor, cur, tag;
        var dir, skip = 0,
            sTag, eTag, availTags, matched;
        
        $(".CodeMirror").each(function () {
            
            if($(this).css("display") !== "none") {
                
                activeEditor = $(this);
                return false;
            }
        });

        cur = activeEditor.find(".CodeMirror-activeline");
        tag = cur.find(".cm-tag:first").text();
        activeEditor.find(".cm-tag").css("background-color", "");

        try {
            if (tag.indexOf("<") > -1) {
    
                if (tag.indexOf(">") > -1) {
    
                    tag = tag.substr(tag.indexOf("<"), (tag.indexOf(">", tag.indexOf("<")) + 1));
                }
    
                if (tag.length > 1) {
    
                    cur.find(".cm-tag:first").css("background-color", highlightColor);
    
                    if (tag.charAt(1) === "/") { //direction upward.
                        dir = -1;
                        cur = cur.prev();
                    } else {
                        dir = 1;
                        skip = -1;
                    }
    
                    tag = tag.replace("<", "").replace(">", "").replace("/", "");
                    sTag = "<" + tag;
                    eTag = "</" + tag + ">";
    
                    while (cur && cur.length > 0) { //for each line.
    
                        availTags = cur.find(".cm-tag");
    
                        if (dir === -1) {
    
                            availTags = $(availTags).reverse();
                        }
    
                        availTags.each(function () {
    
                            tag = $(this).text();
                            matched = false;
    
                            if (tag.indexOf(sTag) > -1 && tag.indexOf(eTag) > -1) { //we have both start and end tags. tag should be like this "<div></div>" Or "</div><div>"                                
                                matched = true;
    
                                if (tag.indexOf(sTag) < tag.indexOf(eTag)) {
                                    skip = skip + 1;
                                }
                            } else if (tag.indexOf(sTag) > -1) { //we have start tag. "<div"
    
                                if (dir === -1) {
                                    matched = true;
                                } else { //we are lookihg for END tag, meanwhile, we have found another START tag. So we should skip next matched end tag.
                                    skip = skip + 1;
                                }
                            } else if (tag.indexOf(eTag) > -1) { //we have end tag. "</div>"
    
                                if (dir === 1) {
                                    matched = true;
                                } else { //we are lookihg for START tag, meanwhile, we have found another END tag. So we should skip next matched START tag.
                                    skip = skip + 1;
                                }
                            }
    
                            if (matched === true) {
    
                                if (skip === 0) {
                                    cur = undefined;
                                    $(this).css("background-color", highlightColor);
    
                                    return false;
                                } else {
                                    skip = skip - 1;
                                }
                            }
                        });
    
                        if (cur) {
                            cur = (dir === 1) ? cur.next() : cur.prev();
                        } else {
    
                            break;
                        }
                    }
                }
            }
        } catch (err) {
        }
    }

    function activeEditorChanged() {

        try {
            var lan = em.getActiveEditor().document.getLanguage().getName();
            
            if (lan === "HTML" || lan === "PHP") {
                em.getActiveEditor()._codeMirror.on("cursorActivity", listenCursorActivity);
            }
        } catch (err) {
        }
    }
    
    $(em).on("activeEditorChange", activeEditorChanged);
    $.fn.reverse = [].reverse;
});