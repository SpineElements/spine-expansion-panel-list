/*
 * Copyright (c) 2000-2018 TeamDev. All rights reserved.
 * TeamDev PROPRIETARY and CONFIDENTIAL.
 * Use is subject to license terms.
 */


/**
 * A "parent" node in a combined hierarchy of light and shadow DOMs.
 *
 * @param {Node} node  a node whose parent should be returned
 * @returns {Node} an immediate parent of the specified `node`, or a host element if the `node`
 *                 represents a shadow root
 */
function getImmediateParentDeep(node) {
  if (node.parentNode) {
    return node.parentNode;
  }
  if (node instanceof ShadowRoot) {
    return node.host;
  }
  return null;
}

/**
 * Finds the nearest parent that satisfies the specified `condition` in a combined hierarchy of
 * light and shadow DOMs.
 *
 * @param {Node} node
 * @param {function(Node):Boolean} condition
 * @returns {Node}
 */
function findParentElementDeep(node, condition) {
  while(true) {
    node = getImmediateParentDeep(node);
    if (!node) {
      return null;
    }
    if (condition(node)) {
      return node;
    }
  }
}

/**
 * @param {Node} parent
 * @param {Node} node
 * @returns {Boolean} `true` if `parent` contains `element` "deeply" (e.g. any light or shadow DOM
 *                    nested under this element on any level
 */
function nodeContainsDeep(parent, node) {
  return !!findParentElementDeep(node, p => p === parent);
}

/**
 * @type {Array.<function(Element):Boolean>}
 */
const popupFalsePositiveIdentifiers = [];

/**
 * By default all elements whose `position` CSS attribute is either `absolute` or `fixed` is are
 * considered as popup elements (such as dialogs, menus, etc.)
 *
 * In practice, at least `position: absolute` elements can be present not just for implementing
 * popups, but also for a regular application's layout. This function can be used by applications
 * to register their application-specific rules of what absolutely or fixed positioned elements
 * should actually be not considered as popups.
 *
 * @param {function(Element):Boolean} isFalsePositive Accepts an element that is considered as an
 *                                                    element that prior analysis have shown to be
 *                                                    a popup element. This function can return
 *                                                    `true` to indicate that it "knows" that it is
 *                                                    not a popup element.
 */
export function addFalsePositiveIdentifier(isFalsePositive) {
  popupFalsePositiveIdentifiers.push(isFalsePositive);
}

function isPopupElement(element) {
  const position = getComputedStyle(element)['position'];
  const elementCanBeAPopup = position === 'absolute' || position === 'fixed';
  if (!elementCanBeAPopup) {
    return false;
  }
  const notAPopupActually = popupFalsePositiveIdentifiers.some(isFalsePositive =>
      isFalsePositive(element)
  );
  return !notAPopupActually;

}

/**
 * Checks whether the passed event occurred inside of the `referenceElement` or outside of it.
 *
 * @param {Event} event
 * @param {Element} referenceElement
 * @returns {boolean} `true`, if an event is considered as being performed outside of the provided
 *                     `referenceElement`, and `false` otherwise
 */
export function isOuterClickEvent(event, referenceElement) {
  const eventPath = event.composedPath();
  const inSubtree = eventPath.some(eventTarget =>
      eventTarget !== referenceElement &&
      eventTarget instanceof Node &&
      referenceElement.contains(eventTarget)
  );
  if (inSubtree) {
    return false;
  }

  const onPopupElement = eventPath.find(el => {
    if (! (el instanceof Element)) {
      // can't calculate computed style on non-element nodes, e.g. window
      return false;
    }
    return isPopupElement(el);
  });
  if (onPopupElement) {
    const onParentPath = nodeContainsDeep(onPopupElement, referenceElement);
    if (onParentPath) {
      // a popup that contains referenceElement element (outisde click)
      return true;
    }
    // all other popups are treated as popups nested in referenceElement, which are structurally
    // outside of referenceElement's nested DOM to solve stacking context issues, but are logically
    // invoked from inside of referenceElement
    return false;
  }
  return true;
}
