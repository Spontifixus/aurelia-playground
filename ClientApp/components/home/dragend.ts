import { autoinject, customAttribute } from 'aurelia-framework';
import * as $ from 'jquery';

@customAttribute('dragend')
@autoinject
export class DragendAttribute {
    constructor(private element: Element) {
        alert((<any>$(element)).dragend());
    }
}