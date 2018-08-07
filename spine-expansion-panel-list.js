/*
 * Copyright (c) 2000-2018 TeamDev. All rights reserved.
 * TeamDev PROPRIETARY and CONFIDENTIAL.
 * Use is subject to license terms.
 */

import {LitElement, html} from '@polymer/lit-element';
import {render} from 'lit-html/lit-html.js';

import '@polymer/paper-styles/shadow.js';
import './spine-template-stamper.js';
import { microTask } from '@polymer/polymer/lib/utils/async.js';

/**
 * An element that displays an associated array of items as a list of panels showing a summary view
 * for each item, and allows expanding any item to display a full item view.
 *
 * You can specify the template for the content that should be displayed for each item in the nested
 * `template` element. This template will be stamped for each of the provided items with a different
 * value of the `item` variable, which can be used inside the template's elements to refer to the
 * respective item object.
 *
 * A template for an expanded item can be specified using an additional nested `template` element
 * with `class="expanded"` attribute.
 *
 * Example:
 * ```
 * <spine-expansion-panel-list items="[[attachments]]">
 *   <template>
 *     <div>Name: [[item.name]]</div>
 *     <div>Size: [[item.size]]</div>
 *   </template>
 *   <template class="expanded">
 *     <div>Name: [[item.name]]</div>
 *     <img src="[[item.imageUrl]]>
 *   </template>
 * </spine-expansion-panel-list>
 * ```
 *
 * ### Styling
 *
 * The templates provided are stamped in the light DOM of the `spine-expansion-panel-list` element,
 * so regular CSS declarations in your element will be applicable to the item elements rendered with
 * these templates. `spine-expansion-panel-list` renders some intermediate container elements as
 * containers of the actual stamped templates, which is considered as an implementation details, and
 * these elements shouldn't be relied upon in your CSS declarations.
 *
 * You can use the following custom CSS properties and mixins:
 *
 * Custom property/mixin                         | Description                                    | Default
 * ----------------------------------------------|------------------------------------------------|----------
 * `--spine-expansion-panel-list-item`           | Mixin applied to all list item containers      | `{}`
 * `--spine-expansion-panel-list-expanded-item`  | Mixin applied to expanded list item containers | `{}`
 * `--spine-expansion-panel-list-expansion-size` | Size by which an expanded item's left/right edges stand out relative to the side edges of collapsed items | `20px`
 *
 */
class SpineFloatingExpansionList extends LitElement {
  static get properties() {
    return {
      items: Array,
      expandedItem: Object,
      renderCollapsedItem: Function,
      renderExpandedItem: Function,
      /**
       * This property is an internal mirror of the `expandedItem` property, and it is needed
       * instead of just using the `expandedItem` property in order to be able to measure and
       * update item heights before the `_expandedItem` that is bound to the elements is
       * changed, which is needed for a proper item height animation (see the
       * `_handleExpandedItemChange` method).
       */
      _expandedItem: Object
    }
  }

  constructor() {
    super();
    this.items = [];
    this._documentClickListener = (event) => {
      this._handleDocumentClick(event)
    }
  }

  _render(props) {
    return html`
      <style>
        :host {
          display: block;
  
          ---spine-epl-divider-color: rgba(0, 0, 0, var(--dark-divider-opacity, 0.12));
        }
  
        #container ::slotted(.-spine-expansion-panel-list-item) {
          margin: 0 var(--spine-expansion-panel-list-expansion-size, 20px);
          @apply --shadow-elevation-2dp;
          background: var(--primary-background-color, #ffffff);
          color: var(--primary-text-color, #000000);
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
  
          @apply --spine-expansion-panel-list-item;
          overflow: hidden;
        }
  
        #container ::slotted(.-spine-expansion-panel-list-item:not([expanded]):not([ends-collapsed-range])) {
          border-bottom: 1px solid var(---spine-epl-divider-color);
        }
  
        #container ::slotted(.-spine-expansion-panel-list-item[expanded]) {
          margin: 16px 0;
          @apply --shadow-elevation-8dp;
  
          cursor: default;
  
          @apply --spine-expansion-panel-list-expanded-item;
        }
      </style>
  
      <div id="container">
        <slot></slot>
      </div>    
    `;
  }

  /**
   * Similar to `_render`, but renders content that should be placed in an element's light DOM.
   *
   * The item elements, with their respective custom content templates that have been provided via
   * `renderCollapsedItem` and `renderExpandedItem` properties, have to be rendered into element's
   * light DOM and not shadow DOM.
   *
   * This is needed for their style to be customizable with CSS declarations present in the
   * context where the `spine-expansion-panel-list` element is used.
   */
  _renderLightDOM({items, _expandedItem, renderCollapsedItem, renderExpandedItem}) {
    return html`${
      items.map(item => html`
        <div class="-spine-expansion-panel-list-item" 
             expanded$="${this._isItemExpanded(item, _expandedItem)}" 
             ends-collapsed-range="${this._getItemEndsCollapsedRange(item, _expandedItem)}" 
             on-click="${e => this._handleItemClick(item)}">
          <div class="-spine-expansion-panel-list-item-content">
            ${!this._useItemExpandedTemplate(item, _expandedItem) ?
              html`
                <!--
                  The "overflow: hidden" style is added below to prevent collapsing the stamper
                  children's margins, e.g. if <h2> is placed as the first template's tag,
                  see this approach here: https://stackoverflow.com/a/19719427
                  This is needed for a proper "height: auto" animation in
                  \`_handleExpandedItemChange\` method.

                  Inplace style is used instead of a dedicated CSS rule since this template is
                  rendered in the element's light DOM (not shadow DOM), and the ::slotted CSS
                  selector can target only top-level slot nodes, as noted here:
                  https://developers.google.com/web/fundamentals/web-components/shadowdom#stylinglightdom
                -->
                <div style="overflow: hidden">
                  ${renderCollapsedItem(item)}
                </div>
              `
              :
              html`                  
                <div style="overflow: hidden"> 
                  ${renderExpandedItem(item)}                      
                </div>
              `
            }
          </div>
        </div>
      `)
    }`;
  }

  /**
   * @override
   */
  _applyRender(result, node) {
    // render shadow DOM tree
    super._applyRender(result, node);

    // render light DOM tree
    const {items, _expandedItem, renderCollapsedItem, renderExpandedItem} = this;
    const lightDOMTemplateResult = this._renderLightDOM(
        {items, _expandedItem, renderCollapsedItem, renderExpandedItem}
    );
    render(lightDOMTemplateResult, this);
  }

  _propertiesChanged(props, changedProps, oldProps) {
    super._propertiesChanged(props, changedProps, oldProps);
    if (changedProps && changedProps.expandedItem !== undefined) {
      this._handleExpandedItemChange();
    }
  }

  _isItemExpanded(item, expandedItem) {
    return item === expandedItem;
  }

  _getItemEndsCollapsedRange(item, expandedItem) {
    const itemIndex = this.items.indexOf(item);
    if (itemIndex === -1) {
      return false;
    }

    if (itemIndex === this.items.length - 1) {
      return true;
    }

    const expandedItemIndex = this.items.indexOf(expandedItem);
    if (expandedItemIndex === -1) {
      return false;
    }
    return itemIndex === expandedItemIndex - 1;
  }

  _useItemExpandedTemplate(item, expandedItem) {
    return this._isItemExpanded(item, expandedItem) && this.renderExpandedItem != null;
  }

  _handleItemClick(item) {
    this.expandedItem = item;
    this.dispatchEvent(new CustomEvent('expanded-item-changed'));
  }

  _getItemElements() {
    return this.querySelectorAll('.-spine-expansion-panel-list-item');
  }

  _getItemContentElement(itemElement) {
    return itemElement.querySelector('.-spine-expansion-panel-list-item-content');
  }

  static __getTransitionDuration(element) {
    if (!element) {
      return 0;
    }
    const transitionDuration = getComputedStyle(element)['transition-duration'];
    if (!transitionDuration) {
      return 0;
    }
    if (transitionDuration.endsWith('ms')) {
      return parseInt(transitionDuration);
    } else if (transitionDuration.endsWith('s')) {
      return parseFloat(transitionDuration) * 1000;
    } else {
      throw new Error(`Couldn't parse transition-duration value: ${transitionDuration}`);
    }
  }

  _handleExpandedItemChange() {
    const itemElements = this._getItemElements();
    const elementForItem = (item, indexCorrection = 0) =>
        itemElements[this.items.indexOf(item) + indexCorrection];
    const prevExpandedElement = elementForItem(this._expandedItem);
    const newExpandedElement = elementForItem(this.expandedItem);

    const itemHeightsToAnimate = [prevExpandedElement, newExpandedElement].filter(el => el);

    const setItemHeightByContent = element => {
      const itemContentElement = this._getItemContentElement(element);
      element.style.height = `${itemContentElement.offsetHeight}px`;
    };
    const setItemHeightAuto = element => {
      element.style.height = 'auto';
    };

    // we need to set the fixed initial item heights instead of 'auto' values in order for
    // the height transition animation to work (which doesn't work with 'auto' values)
    itemHeightsToAnimate.forEach(setItemHeightByContent);
    this._expandedItem = this.expandedItem;
    microTask.run(() => {
      if (!this.ownerDocument) {
        // skip further animation if the element was removed from the document already
        return;
      }
      // start the height transition animation by setting height to match the updated content;
      // this should be done after an async delay to let the `dom-if` elements to restamp the
      // contents of expanded/collapsed items before we measure their new heights
      itemHeightsToAnimate.forEach(setItemHeightByContent);
      const transitionDuration =
          this.constructor.__getTransitionDuration(itemHeightsToAnimate[0]);
      setTimeout(() => {
        // remove fixed item heights and set them back to 'auto' for any subsequent height
        // changes that might occur dynamically (e.g. due to content changes) are not ignored
        itemHeightsToAnimate.forEach(setItemHeightAuto);
      }, transitionDuration);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._documentClickListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._documentClickListener);
  }

  _handleDocumentClick(event) {
    if (event.composedPath().some(el =>
        el !== this && el instanceof Node && this.contains(el)
    )) {
      // one of the items was clicked, no auto collapsing is required
      return;
    }
    this.expandedItem = null;
  }
}

window.customElements.define('spine-expansion-panel-list', SpineFloatingExpansionList);
