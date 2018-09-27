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
        const lightDOMTemplateResult = this._renderLightDOM();
        render(lightDOMTemplateResult, this);
      }
    });
export default lightAndShadowDomRenderingMixin;
