/*
 * Copyright (c) 2000-2018 TeamDev. All rights reserved.
 * TeamDev PROPRIETARY and CONFIDENTIAL.
 * Use is subject to license terms.
 */

import '@polymer/polymer/polymer-legacy.js';

import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { templatize } from '@polymer/polymer/lib/utils/templatize.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

/**
 * This element is internal to the `spine-expansion-panel-list` implementation, and shouldn't be
 * used outside of this package. It can be changed in a backwards incompatible way or removed. **
 *
 * Renders an associated template into the light DOM of this element with the provided properties.
 */
class SpineTemplateStamper extends PolymerElement {
  static get template() {
    return html`
    <style>
      :host {
        display: block;
      }
    </style>
    <slot></slot>
`;
  }

  static get is() { return 'spine-template-stamper'; }

  static get properties() {
    return {
      customTemplate: {
        type: HTMLTemplateElement,
        observer: '_handleCustomTemplateChange'
      },
      props: {
        type: Object,
        observer: '_handlePropertiesChange'
      }
    }
  }

  ready() {
    super.ready();

    this._stampCustomTemplate();
  }

  _handleCustomTemplateChange() {
    this._stampCustomTemplate();
  }

  _stampCustomTemplate() {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    if (!this.customTemplate) {
      return;
    }

    const template = this.customTemplate;
    const CustomTemplateInstance = template.___spine_template_stamper_templatized =
        template.___spine_template_stamper_templatized ||
        templatize(template, null, {
          mutableData: true,
          parentModel: true,
          instanceProps: Object.keys(this.props).reduce((target, propertyName) =>
              Object.assign(
                target || {},
                {[propertyName]: true})
          )
        });
    this._customTemplateInstance = new CustomTemplateInstance(this.props);
    this.appendChild(this._customTemplateInstance.root);
  }

  _handlePropertiesChange() {
    if (this._customTemplateInstance) {
      this._customTemplateInstance.setProperties(this.props);
    }
  }
}

window.customElements.define(SpineTemplateStamper.is, SpineTemplateStamper);
