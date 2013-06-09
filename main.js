/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets*/

define(function (require, exports, module) {
    "use strict";
    
    /*
    sTag - start tag
    eTag - end tag
    dir  - direction
    lh   - lineHandle
    em   - editorManager
    cm   - codeMirror.
    tm - textMarker.
    */

    var em = brackets.getModule("editor/EditorManager");  
    var cm, tm1, tm2, sTag, eTag, dir, line = -1, skip;  

    //test case: doVisualHighlight({text: "        <div><div>"}, "<div>", 1, true);
    function doVisualHighlight (lh, tag, pos, reverse) {
        
        var str = lh.text, start = str.length, end = 0, lineNum = cm.doc.getLineNumber(lh), tm;

        while (pos > -1) {

            if(reverse) {
                start = str.lastIndexOf(tag, (start - 1));
                end = start + tag.length;
            } else {
                start = str.indexOf(tag, end);
                end = start + tag.length;
            }
            
            pos --;
        }

         // console.log(start + " ### " + end + " ### " + str.substring(start, end));
        tm = cm.doc.markText(CodeMirror.Pos(lineNum, start), CodeMirror.Pos(lineNum, end), {className: "CodeMirror-matchingbracket"});
        tm.pos = CodeMirror.Pos(lineNum, start);
        tm.focus = false;

        return tm;
    } 

    
    function getTagsFromHandle (lh) {
        
        if(lh && lh.styles)
        {
            lh = lh.styles.filter(function(element, index, array) {

                    if((index + 1 < array.length) && array[index + 1] === "tag") return true; 
               });
        } else lh = [];

        return lh;
    }
    
    function startTagHighlight () {  
        
        var fTag, s, e;    
        
        if(tm1) tm1.clear();
        if(tm2) tm2.clear();
        tm1 = undefined; tm2 = undefined;
        skip = 0;

        if(cm.getSelection() !== "") return;

        line = cm.doc.getCursor().line;
        fTag = getTagsFromHandle(cm.getLineHandle(cm.doc.getCursor().line))[0]; 
        
        if (fTag && fTag.length > 1) {            

            if (fTag.charAt(1) === "/") { //direction upward.
                dir = -1;
                skip = 1;
            } else {
                dir = 1;
            }
            
            //possible fTag patterns "<div>", "<div", "</div>", "<div/>", "</div><span". so we should split "div" alone
            s = fTag.indexOf("<"); 
            e = fTag .indexOf(">");
            if(s > -1 && e > -1) fTag = fTag.substring(s, e + 1);
            fTag = fTag.replace("<", "").replace(">", "").replace("/", "");

            sTag = "<" + fTag; //start tag
            eTag = "</" + fTag + ">"; //end tag
            
            tm1 = doVisualHighlight(cm.getLineHandle(cm.doc.getCursor().line), ((dir === 1) ? sTag : eTag) , 0); //highlight a tag (start or end) on active line.
            tm1.focus = true;
            scanToHighlight(); //scan and highlight matched tag (start or end).         
        }
    }
    
    function scanToHighlight () {

        var availTags, tags, matched, cur, start, end, lines = [], matchCountAtThisLine, targetTag;

        if(end - start > 3000) return;

        if(dir === 1) {
            start = line; end = cm.doc.lastLine() + 1;
        } else {
            start = 0; end = line;
        }

        targetTag = ((dir === 1) ? eTag : sTag);

        //collect all line handles.
        cm.doc.eachLine(start, end, function (lh) {
            lines.push(lh);
        });

        if(dir === -1) lines = lines.reverse();        
        

        lines.forEach(function (lh) {
        
            if (line === -1) return;

            matchCountAtThisLine = 0;
            availTags = getTagsFromHandle(lh);

            if (dir === -1) availTags = availTags.reverse();             

            for (var index = 0; index < availTags.length; index ++)
            {
                matched = false;
                tags = availTags[index].match(new RegExp(sTag + "|" + eTag, "g"));

                if(tags)
                {
                    if(dir === -1) tags = tags.reverse();

                    for(var t = 0; t < tags.length; t ++)
                    {
                        if(tags[t].indexOf(targetTag) > -1) {
                            skip = skip - 1;
                            matchCountAtThisLine = matchCountAtThisLine + 1;
                        } else {
                            skip = skip + 1;
                        }

                        if(skip === 0) break;
                    }

                    if (skip < 1) {                                    
                    
                        line = -1;
                        tm2 = doVisualHighlight(lh, targetTag , (matchCountAtThisLine - 1 + skip), (dir === -1));                        
                        break;
                    } 
                }                               
            }            
        });      
    }   

    function handleKeyEvent(jqe, e, event) {

        //shift + J on windows.
        if(event.type === "keyup" && event.altKey && event.keyCode === 74) {

            if(tm1 && !tm1.focus) {
                cm.scrollIntoView(tm1.pos); tm1.focus = true;
                if(tm2)tm2.focus = false;
            } else if(tm2 && !tm2.focus){
                cm.scrollIntoView(tm2.pos); tm2.focus = true; 
                if(tm1)tm1.focus = false;
            }
        }
    }
    
    function activeEditorChanged() {
        
        try {
            var editor = em.getActiveEditor();
            var lan = editor.document.getLanguage().getName();

            if (lan === "HTML" || lan === "PHP") {
                cm = editor._codeMirror;
                cm.on("cursorActivity", startTagHighlight);
                $(editor).on("keyEvent", handleKeyEvent);
            }
        } catch (err) {
            console.error("HTML-tag-highlight : " + err.message);
        }
    }
    
    $(em).on("activeEditorChange", activeEditorChanged);
});

