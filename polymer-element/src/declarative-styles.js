/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  var STYLE_SELECTOR = 'style';
  var SHEET_SELECTOR = '[rel=stylesheet]';
  var STYLE_SCOPE_ATTRIBUTE = 'element';
  var STYLE_GLOBAL_SCOPE = 'global';
  var SCOPE_ATTR = 'polymer-scope';

  // imports

  var log = window.logFlags || {};

  var styles = {
    STYLE_SCOPE_ATTRIBUTE: STYLE_SCOPE_ATTRIBUTE,
    /**
     * Install external stylesheets loaded in <element> elements into the 
     * element's template.
     * @param elementElement The <element> element to style.
     */
    installSheets: function() {
      this.installLocalSheets();
      this.installGlobalStyles();
    },
    /**
     * Takes external stylesheets loaded in an <element> element and moves
     * their content into a <style> element inside the <element>'s template.
     * The sheet is then removed from the <element>. This is done only so 
     * that if the element is loaded in the main document, the sheet does
     * not become active.
     * Note, ignores sheets with the attribute 'polymer-scope'.
     * @param elementElement The <element> element to style.
     */
    installLocalSheets: function () {
      var sheets = this.findNodes(SHEET_SELECTOR, function(s) {
        return !s.hasAttribute(SCOPE_ATTR);
      });
      var content = elementTemplateContent(this);
      if (content) {
        // in case we're in document, remove from element
        var cssText = '';
        sheets.forEach(function(sheet) {
          sheet.parentNode.removeChild(sheet);
          cssText += cssTextFromSheet(sheet) + '\n';
        });
        if (cssText) {
          content.insertBefore(createStyleElement(cssText), content.firstChild);
        }
      }
    },
    /**
     * Promotes external stylesheets and <style> elements with the attribute 
     * polymer-scope='global' into global scope.
     * This is particularly useful for defining @keyframe rules which 
     * currently do not function in scoped or shadow style elements.
     * (See wkb.ug/72462)
     * @param elementElement The <element> element to style.
    */
    // TODO(sorvell): remove when wkb.ug/72462 is addressed.
    installGlobalStyles: function() {
      var style = this.styleForScope(STYLE_GLOBAL_SCOPE);
      applyStyleToScope(style, document.head);
    },
    findNodes: function(selector, matcher) {
      var nodes = array(this.querySelectorAll(selector));
      var content = elementTemplateContent(this);
      if (content) {
        var templateNodes = array(content.querySelectorAll(selector));
        nodes = nodes.concat(templateNodes);
      }
      return nodes.filter(matcher);
    },
    cssTextForScope: function(scopeDescriptor) {
      var cssText = '';
      // handle stylesheets
      var selector = '[' + SCOPE_ATTR + '=' + scopeDescriptor + ']';
      var matcher = function(s) {
        return matchesSelector(s, selector);
      };
      var sheets = this.findNodes(SHEET_SELECTOR, matcher);
      sheets.forEach(function(sheet) {
        // in case we're in document, remove from element
        sheet.parentNode.removeChild(sheet);
        cssText += cssTextFromSheet(sheet) + '\n\n';
      });
      // handle style elements
      var styles = this.findNodes(STYLE_SELECTOR, matcher);
      styles.forEach(function(style) {
        // in case we're in document, remove from element
        style.parentNode.removeChild(style);
        cssText += style.textContent + '\n\n';
      });
      return cssText;
    },
    styleForScope: function(scopeDescriptor) {
      var cssText = this.cssTextForScope(scopeDescriptor);
      if (cssText) {
        var style = createStyleElement(cssText);
        style.setAttribute(STYLE_SCOPE_ATTRIBUTE, this.options.name +
            '-' + scopeDescriptor);
        return style;
      }
    }
  };

  function elementTemplateContent(elementElement) {
    var template = elementElement.querySelector('template');
    return template && templateContent(template);
  }

  function applyStyleToScope(style, scope) {
    if (style) {
      // TODO(sorvell): necessary for IE
      // see https://connect.microsoft.com/IE/feedback/details/790212/
      // cloning-a-style-element-and-adding-to-document-produces
      // -unexpected-result#details
      // var clone = style.cloneNode(true);
      var clone = createStyleElement(style.textContent);
      scope.appendChild(clone);
    }
  }

  function createStyleElement(cssText) {
    var style = document.createElement('style');
    style.textContent = cssText;
    return style;
  }
  
  function array(list) {
    return list ? Array.prototype.slice.call(list, 0) : [];
  }

  function cssTextFromSheet(sheet) {
    return (sheet && sheet.__resource) || '';
  }

  function matchesSelector(node, inSelector) {
    if (matches) {
      return matches.call(node, inSelector);
    }
  }
  var p = HTMLElement.prototype;
  var matches = p.matches || p.matchesSelector || p.webkitMatchesSelector 
      || p.mozMatchesSelector;
  
  // exports

  scope.api.declarative.styles = styles;
  scope.applyStyleToScope = applyStyleToScope;
  
})(Polymer);