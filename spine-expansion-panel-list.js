/*
 * Copyright (c) 2000-2018 TeamDev. All rights reserved.
 * TeamDev PROPRIETARY and CONFIDENTIAL.
 * Use is subject to license terms.
 */

import {render} from 'lit-html/lit-html.js';
import {LitElement, html} from '@polymer/lit-element';
import {microTask} from '@polymer/polymer/lib/utils/async.js';
import '@polymer/paper-styles/shadow.js';
import {isOuterClickEvent, findParentElementDeep} from './dom-helpers.js';
import lightAndShadowDomRenderingMixin from './spine-light-and-shadow-dom-rendering-mixin.js';


/**
 * A CSS class name that can be applied to a child element of expanded item layout in order to make
 * it collapse the item when it is clicked.
 *
 * @type {string}
 */
export const expansionToggleClassName = 'spine-epl-expansion-toggle';

const listItemClassName = '-spine-expansion-panel-list--item';

/**
 * An element that displays an associated array of items as a list of panels showing a summary view
 * for each item, and allows expanding any item to display a full item view.
 *
 * You can specify the template for the content that should be displayed for each item using the
 * `renderItem` property, which should be declared as a function that accepts an item, and its state
 * parameters such as `expanded` and `focused` values, and returns a respective lit-html
 * `TemplateResult` instance. This function will be used for rendering each of the provided items.
 *
 * A template for an expanded item can alternatively be specified separately using the
 * `renderExpandedItem` property, which works similarly to `renderItem`, but is invoked for
 * rendering an expanded item. If this attribute is specified, the function specified with
 * `renderItem` will be used only for rendering collapsed items.
 *
 * Example:
 * ```
 * <spine-expansion-panel-list
 *     items="${attachments}"
 *
 *     renderItem="${item => html`
 *       <div>Name: ${item.name}</div>
 *       <div>Size: ${item.size}</div>
 *     `}"
 *
 *     renderExpandedItem="${item => html`
 *       <div class="spine-epl-expansion-toggle">Name: ${item.name}</div>
 *       <img src="${item.imageUrl}">
 *     `}">
 * </spine-expansion-panel-list>
 * ```
 *
 * ### Item Expansion and Collapsing
 *
 * A user can expand and collapse items either using a mouse or a keyboard (by pressing Tab to focus
 * a respective item, Enter to expand it, and Esc to collapse it).
 *
 * It is also possible to make certain portion(s) of an expanded item's layout as active areas that
 * can be clicked to collapse an item. To do this, add the `spine-epl-expansion-toggle` class to the
 * respective element in an expanded layout.
 *
 * This element dispatches a non-bubbling `expanded-item-changed` event when an expanded item is
 * changed. You can read the `event.detail.expandedItem` property from the dispatched `event` to
 * detect which item has been expanded (will be `null` if no items are expanded).
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
 * `--spine-expansion-panel-list-focus-color`    | A color for displaying a focus bar and a semi-transparent overlay for a focused item | `var(--accent-color, #ff4081)`
 * `--spine-expansion-panel-list-item-focus-bar` | Mixin for a focus bar for a focused item (displayed on the left item's side by default) | `{}`
 * `--spine-expansion-panel-list-item-focus-overlay` | Mixin for an semi-transparent overlay that is displayed over a focused item | `{}`
 * `--shadow-elevation-2dp`                      | Mixin that specifies a shadow displayed for collapsed items by default | (see @polymer/paper-styles/shadow.js)
 * `--shadow-elevation-8dp`                      | Mixin that specifies a shadow displayed for expanded items by default  | (see @polymer/paper-styles/shadow.js)
 *
 */
class SpineFloatingExpansionList extends lightAndShadowDomRenderingMixin(LitElement) {
  static get properties() {
    return {
      /**
       * An array of objects (or values of other type) that identify the list of items being
       * rendered by this component. Each item in this array is used as a model that will be passed
       * to an item template rendering function when a corresponding item is rendered. See the
       * `renderItem` and `renderExpandedItem` properties.
       *
       * A component's user is free to choose any type and form of the item objects provided in this
       * array.
       */
      items: Array,
      /**
       * This property can be used for detecting and changing the currently expanded item. It is
       * expected to be one of the values in the `items` array.
       */
      expandedItem: Object,
      /**
       * A function for rendering collapsed items. It receives two parameters:
       *  - {*}       item     — an item's value from the `items` array.
       *  - {Boolean} expanded — set to `true` if the item is expanded, and `false` if collapsed.
       *  - {Boolean} focused  — set to `true` if the item is focused (including when any of its
       *                         subelements are focused).
       *
       * This function should returns the lit-html's `TemplateResult` that corresponds to the
       * content that should be rendered for this item.
       *
       * This function is invoked for both expanded and collapsed items if the `renderExpandedItem`
       * property is not set, and only for collapsed items if `renderExpandedItem` is set.
       */
      renderItem: Function,
      /**
       * An optional function for rendering expanded items. If not specified, the one specified in
       * `renderItem` will be used for rendering both expanded and collapsed items.
       *
       * It receives one argument:
       *  - {*} item — an item's value from the `items` array.
       *  - {Boolean} focused  — set to `true` if the item is focused (including when any of its
       *                         subelements are focused).
       *
       * Returns the lit-html's `TemplateResult` that corresponds to the content that should be
       * rendered for this item in its expanded state.
       */
      renderExpandedItem: Function,
      /**
       * Contains item value of a currently focused item. Item is considered focused here when
       * either its main element is focused, or any of its subelements are focused.
       */
      _focusedItem: Element
    }
  }

  constructor() {
    super();
    this.expandedItem = null;
    this.items = [];
    this._handleAnyClick = this._handleAnyClick.bind(this);
    this._handleAnyFocus = this._handleAnyFocus.bind(this);
    this._handleAnyBlur = this._handleAnyBlur.bind(this);
  }

  _render(props) {
    return html`
      <style>
        :host {
          display: block;
  
          ---spine-epl-divider-color: rgba(0, 0, 0, var(--dark-divider-opacity, 0.12));
          ---spine-epl-focus-color: var(--spine-expansion-panel-list-focus-color, var(--accent-color, #ff4081));
        }
  
        #container ::slotted(.-spine-expansion-panel-list--item) {
          position: relative;
          margin: 0 var(--spine-expansion-panel-list-expansion-size, 20px);
          @apply --shadow-elevation-2dp;
          background: var(--primary-background-color, #ffffff);
          color: var(--primary-text-color, #000000);
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
          /* avoid displaying default focus outline */
          outline: none;
  
          @apply --spine-expansion-panel-list-item;
          overflow: hidden;
        }
  
        #container ::slotted(.-spine-expansion-panel-list--item:not([expanded]):not([ends-collapsed-range])) {
          border-bottom: 1px solid var(---spine-epl-divider-color);
        }
  
        #container ::slotted(.-spine-expansion-panel-list--item[expanded]) {
          margin: 16px 0;
          @apply --shadow-elevation-8dp;
  
          cursor: default;
  
          @apply --spine-expansion-panel-list-expanded-item;
        }
        
        #container ::slotted(.-spine-expansion-panel-list--item:not([expanded]).-sepl-focused-item)::before {
          content: '';
          background: var(---spine-epl-focus-color);
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          
          @apply --spine-expansion-panel-list-item-focus-bar;
        }

        #container ::slotted(.-spine-expansion-panel-list--item:not([expanded]).-sepl-focused-item)::after {
          content: '';
          background: var(---spine-epl-focus-color);
          position: absolute;
          pointer-events: none;
          left: 0;
          top: 0;
          bottom: 0;
          right: 0;
          opacity: 0.03;
          
          @apply --spine-expansion-panel-list-item-focus-overlay;
        }
      </style>
  
      <div id="container">
        <slot></slot>
      </div>    
    `;
  }

  /**
   * The item elements, with their respective custom content templates that have been provided via
   * `renderItem` and `renderExpandedItem` properties, have to be rendered into element's
   * light DOM and not shadow DOM.
   *
   * This is needed for their style to be customizable with CSS declarations present in the
   * context where the `spine-expansion-panel-list` element is used.
   *
   * @override
   */
  _renderLightDOM() {
    const {items, expandedItem, renderItem, renderExpandedItem, _focusedItem} = this;
    if (!renderItem) {
      throw new Error('The `renderItem` property of spine-expansion-panel-list must be specified');
    }
    return html`${
        items.map(item => html`
        <div class$="-spine-expansion-panel-list--item ${item === _focusedItem ? '-sepl-focused-item' : ''}"
             tabindex="0"
             expanded?="${(item === expandedItem)}"
             seplItem="${item}" 
             ends-collapsed-range?="${this._getItemEndsCollapsedRange(item)}" 
             on-click="${e => this._handleItemClick(item, e)}"
             on-keydown="${e => this._handleItemKeydown(item, e)}">
          <div class="-spine-expansion-panel-list--item-content">
            <!--
              The "overflow: hidden" style is added below to prevent collapsing the custom
              template children's margins, e.g. if <h2> is placed as the first template's tag,
              see this approach here: https://stackoverflow.com/a/19719427
              This is needed for a proper "height: auto" animation in
              the \`_handleExpandedItemChange\` method.

              Inplace style is used instead of a dedicated CSS rule since this template is
              rendered in the element's light DOM (not shadow DOM), and the ::slotted CSS
              selector can target only top-level slot nodes, as noted here:
              https://developers.google.com/web/fundamentals/web-components/shadowdom#stylinglightdom
            -->
            <div style="overflow: hidden">${
              item !== expandedItem || !this.renderExpandedItem
                ? renderItem(item, item === expandedItem, item === _focusedItem)
                : renderExpandedItem(item, item === _focusedItem)
            }</div>
          </div>
        </div>
      `)
    }`;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._handleAnyClick);
    this.addEventListener('focusin', this._handleAnyFocus);
    this.addEventListener('focusout', this._handleAnyBlur);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleAnyClick);
    this.removeEventListener('focus', this._handleAnyFocus);
    this.removeEventListener('blur', this._handleAnyBlur);
  }

  _propertiesChanged(props, changedProps, oldProps) {
    const invokeSuperPropertiesChanged = () => {
      super._propertiesChanged(props, changedProps, oldProps);
    };
    if (changedProps && changedProps.expandedItem !== undefined) {
      this._handleExpandedItemChange(oldProps.expandedItem, invokeSuperPropertiesChanged);
    } else {
      invokeSuperPropertiesChanged();
    }
  }

  /**
   * @param {Object} item          an item to be tested
   * @param {Object} expandedItem  the current expanded item
   * @return {boolean} `true` if item specified by the `item` parameter is the last one in a series
   *                          of consecutive collapsed items (e.g. a last item or an item before an
   *                          expanded one)
   * @private
   */
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

  /**
   * This function is invoked when the `expandedItem` property is changed. It ensures that item
   * heights are animated properly for both old and new expanded items without quick "jumps" in
   * heights.
   *
   * A component is in the following state when this method is invoked:
   * - the `expandedItem` property contains a new value;
   * - a component's UI hasn't been rendered in response to a property change yet: an implementation
   *   of this method is responsible of invoking the `renderUpdatedUI` function passed to it to
   *   render the updated UI accordingly.
   *
   * @param {Object}   prevExpandedItem  A previous value of the `expandedItem` property.
   * @param {Function} renderUpdatedUI   A function that synchronously applies rendering according
   *                                     to the pending property updates (that include an updated
   *                                     `expandedItem` property).
   * @private
   */
  _handleExpandedItemChange(prevExpandedItem, renderUpdatedUI) {
    const setItemHeightByContentHeight = itemElement => {
      const itemContentElement = this._getItemContentElement(itemElement);
      itemElement.style.height = `${itemContentElement.offsetHeight}px`;
    };
    const setItemHeightAuto = itemElement => {
      itemElement.style.height = 'auto';
    };

    const prevExpandedElement = this._getItemElement(prevExpandedItem);
    const newExpandedElement = this._getItemElement(this.expandedItem);
    const itemHeightsToAnimate = [prevExpandedElement, newExpandedElement].filter(el => el);

    // we need to set the fixed initial item heights instead of 'auto' values in order for
    // the height transition animation to work (which doesn't work with 'auto' values)
    itemHeightsToAnimate.forEach(setItemHeightByContentHeight);

    renderUpdatedUI();

    // wait a microtask delay to let a component update a UI if it is not rendered immediately
    microTask.run(() => {
      // start the height transition animation by setting height to match the updated (expanded or
      // collapsed) content height
      itemHeightsToAnimate.forEach(setItemHeightByContentHeight);

      // when animation completes, reset item heights from fixed values back to 'auto' for any
      // subsequent height changes that might occur dynamically are not ignored (e.g. if item
      // content changes dynamically after this)
      const transitionDuration =
          this.constructor.__getElementTransitionDuration(itemHeightsToAnimate[0]);
      setTimeout(() => {
        itemHeightsToAnimate.forEach(setItemHeightAuto);
      }, transitionDuration);
    });
  }

  /**
   * @return {NodeList} a [NodeList](https://developer.mozilla.org/en-US/docs/Web/API/NodeList)
   *                    containing all of the item elements currently displayed by this component
   */
  _getItemElements() {
    return this.querySelectorAll(`.${listItemClassName}`);
  }

  /**
   * @param {Object} item  an item object, as found in the `items` array, whose element should be
   *                       located
   * @return {Element|undefined} an element that displays the provided item, or `undefined` if the
   *                             passed item is not in the current list of items
   */
  _getItemElement(item) {
    const itemElements = this._getItemElements();
    return itemElements[this.items.indexOf(item)];
  }

  /**
   * @param {Element} itemElement
   * @return {Element}
   */
  _getItemContentElement(itemElement) {
    return itemElement.querySelector('.-spine-expansion-panel-list--item-content');
  }

  /**
   * Takes the current value of element's `transition-duration` property and returns a respective
   * duration value in milliseconds if present, or 0 otherwise.
   *
   * @param {Element} element an element to be analyzed
   * @return {number} a transition duration value in milliseconds
   * @private
   */
  static __getElementTransitionDuration(element) {
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

  _setExpandedItem(item) {
    this.expandedItem = item;
    this.dispatchEvent(new CustomEvent('expanded-item-changed', {
      detail: {
        expandedItem: item
      }
    }));
  }

  _handleAnyClick(event) {
    if (isOuterClickEvent(event, this)) {
      this._setExpandedItem(null);
    }
  }

  _getItemByEvent(event) {
    const eventPath = event.composedPath();
    const eventTarget = eventPath[0];
    const itemByEvent = findParentElementDeep(eventTarget,
        el =>
            this.contains(el) && el.classList.contains(listItemClassName),
        this);
    return itemByEvent ? itemByEvent.seplItem : null;
  }

  _handleAnyFocus(event) {
    this._focusedItem = this._getItemByEvent(event);
    if (this._focusedItemResetTimeoutId != null) {
      clearTimeout(this._focusedItemResetTimeoutId);
      this._focusedItemResetTimeoutId = null;
    }
  }

  _handleAnyBlur(event) {
    const itemByEvent = this._getItemByEvent(event);
    if (this._focusedItem === itemByEvent) {
      this._focusedItemResetTimeoutId = setTimeout(() => {
        // reset the focused item (and rerender the view accordingly) after an asynchronous delay
        // in order to avoid the intermediate removal of the focused state when the user traverses
        // over the elements inside of the same record
        this._focusedItemResetTimeoutId = null;
        this._focusedItem = null;
      });
    }
  }

  _handleItemClick(item, event) {
    if (item !== this.expandedItem) {
      this._setExpandedItem(item);
    } else {
      const composedPath = event.composedPath();
      const itemElement = this._getItemElement(item);
      const isExpansionToggle = node =>
          node.classList && node.classList.contains(expansionToggleClassName);

      let clickedExpansionToggle;
      // The expansionToggleClassName class can be either in parent shadow or parent light
      // hierarchy, so checking just parentNode hierarchy of child element that is assigned to
      // a slot of its parent element will skip checking the respective portion of shadow DOM.
      //
      // Hence, checking entries in composedPath helps, since they contain the whole chain including
      // light and shadow DOM nodes.
      for (const eventTarget of composedPath) {
        clickedExpansionToggle = findParentElementDeep(
            eventTarget,
            isExpansionToggle,
            itemElement);
        if (clickedExpansionToggle) {
          break;
        }
      }
      if (clickedExpansionToggle) {
        this._setExpandedItem(null);
      }
    }
  }

  _handleItemKeydown(item, event) {
    const itemElement = this._getItemElement(item);
    const onSubelement = event.target !== itemElement;

    switch (event.keyCode) {
      case 13: // Enter
        if (!onSubelement) {
          this._setExpandedItem(item);
        }
        break;
      case 27: // Esc
        this._setExpandedItem(null);
        break;
    }
  }
}

window.customElements.define('spine-expansion-panel-list', SpineFloatingExpansionList);
