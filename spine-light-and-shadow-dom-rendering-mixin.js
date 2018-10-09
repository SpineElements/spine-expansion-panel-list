/*
 * Copyright (c) 2000-2018 TeamDev. All rights reserved.
 * TeamDev PROPRIETARY and CONFIDENTIAL.
 * Use is subject to license terms.
 */

import {render} from 'lit-html/lit-html.js';
import {html} from '@polymer/lit-element';
import {dedupingMixin} from '@polymer/polymer/lib/utils/mixin.js';

/**
 * A mixin that provides an ability for a component to render to both light and shadow DOMs.
 * It adds a `_renderLightDOM`, which is similar to `_render` method, but renders content to
 * element's light DOM.
 *
 * @mixinFunction
 * @param {*} superClass a class to be mixed up with `lightAndShadowDomRenderingMixin`, expected to
 *                       extend the LitElement class directly or indirectly
 * @returns {*} a class definition that extends the provided `superClass` and has the
 *                     `lightAndShadowDomRenderingMixin` functionality, that should be extended by a
 *                     class that needs to apply this mixin */
const lightAndShadowDomRenderingMixin =
    dedupingMixin(superClass => class extends superClass {
      /**
       * Similar to `_render`, but renders content that should be placed in an element's light DOM.
       *
       * Returning `null` or `undefined` retains the original light DOM content. Original DOM
       * content can be preserved in this way only until it is overwritten by `_renderLightDOM`
       * returning a non-null/non-undefined content at least once after element creation, after
       * which returning `null` or `undefined` makes an empty content to be rendered instead.
       *
       * @protected
       */
      _renderLightDOM() {
        return html``;
      }

      /**
       * @override
       */
      _applyRender(result, node) {
        // render shadow DOM tree
        super._applyRender(result, node);

        // render light DOM tree
        let lightDOMTemplateResult = this._renderLightDOM();
        if (lightDOMTemplateResult != null ||
            this.__lightAndShadowDomRenderingMixin_originalContentRewritten) {
          if (lightDOMTemplateResult == null) {
            lightDOMTemplateResult = html``;
          }
          render(lightDOMTemplateResult, this);
          this.__lightAndShadowDomRenderingMixin_originalContentRewritten = true;
        }
      }
    });
export default lightAndShadowDomRenderingMixin;
