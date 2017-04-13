import { Directive, ExistingProvider, forwardRef, Inject, Input, OpaqueToken, Optional, Type, OnInit } from '@angular/core';

declare var global: any;

const Reflect = global.Reflect;

export const ORIGINAL_TEMPLATE_PROVIDER = new OpaqueToken('ORIGINAL_TEMPLATE_PROVIDER');

export function provideTemplateFrom(component: Type<any>): ExistingProvider {
  return {
    provide: ORIGINAL_TEMPLATE_PROVIDER,
    useExisting: forwardRef(() => component)
  };
}

@Directive({
  selector: '[appOriginalTemplate]'
})
export class OriginalTemplateDirective implements OnInit {

  private static _templateCache = new Map<Type<any>, string>();

  @Input() appOriginalTemplate: string;
  @Input() appOriginalTemplateInner = false;
  @Input() appOriginalTemplatePrecise = false;
  @Input() appOriginalTemplatePreciseIterations = 100;

  private component: Type<any>;

  private get componentName(): string {
    return this.component.name;
  }

  constructor(
    @Inject(ORIGINAL_TEMPLATE_PROVIDER) @Optional() private componentInst: any
  ) {
    if (!componentInst) {
      throw Error(
        'OriginalTemplateDirective: You should provide component via `provideTemplateFrom()` function in your component`s providers!');
    }

    this.component = componentInst.constructor;
  }

  ngOnInit() {
    if (this.componentInst[this.appOriginalTemplate] !== undefined) {
      console.warn(`OriginalTemplateDirective: Overriding property '${this.appOriginalTemplate}' in component '${this.componentName}'`);
    }

    this.componentInst[this.appOriginalTemplate] = this._getPieceOfTemplate();
  }

  private _getPieceOfTemplate(): string {
    const template = this._getTemplate();
    const matchDirective = `appOriginalTemplate=`;
    const matchDirectiveRegex = `${matchDirective}["|']?${this.appOriginalTemplate}["|']?`;

    const tpl = this._getOuterTemplate(template, matchDirectiveRegex);

    if (!tpl) {
      console.warn(`OriginalTemplateDirective: Failed to extract template for directive '${matchDirective}"${this.appOriginalTemplate}"'`);
      return '';
    }

    if (this.appOriginalTemplateInner) {
      return this._getInnerTemplate(this._getPreciseTemplate(tpl));
    } else if (this.appOriginalTemplatePrecise) {
      return this._getPreciseTemplate(tpl);
    }

    return tpl;
  }

  private _getOuterTemplate(tpl: string, matchDirective: string): string {
    const regexp = new RegExp(`(<([^\\s]+).*${matchDirective}.*>[^]*<\/\\2>)`);
    const matches = tpl.match(regexp);

    if (!matches || matches.length < 2) {
      return '';
    }

    return matches[1].trim();
  }

  private _getInnerTemplate(tpl: string): string {
    const regexp = /^<([^\s]+)[^>]*>([^]*)<\/\1>$/;
    const matches = regexp.exec(tpl);

    if (!matches || matches.length < 3) {
      return '';
    }

    return matches[2];
  }

  private _getPreciseTemplate(tpl: string): string {
    const openCloseRegex = /<(\/?[^\s>]+)[^>]*>/g;
    const rootTag = tpl.match(/^<([^\s]+)/);

    if (!rootTag) {
      return tpl; // Inner template does not start with tag - no need to cut deeper
    }

    const rootTagName = rootTag[1];
    let rootTagOpened = 0, i = 0, lastIndex = 0, lastTag = '';

    do {
      const tagMatch = openCloseRegex.exec(tpl);

      if (!tagMatch) {
        break;
      }

      const tag = tagMatch[1];
      lastIndex = tagMatch.index;
      lastTag = tag;

      if (tag === rootTagName) {
        rootTagOpened++;
      } else if (tag === `/${rootTagName}`) {
        rootTagOpened--;
      }
    } while (rootTagOpened && ++i < this.appOriginalTemplatePreciseIterations);

    return tpl.substr(0, lastIndex) + `<${lastTag}>`;
  }

  private _getTemplate(): string {
    if (OriginalTemplateDirective._templateCache.has(this.componentInst)) {
      return OriginalTemplateDirective._templateCache.get(this.componentInst);
    }

    const template = this._getAnnotations().pop().template;
    OriginalTemplateDirective._templateCache.set(this.componentInst, template);

    return template;
  }

  private _getAnnotations(): any[] {
    const annotations = Reflect.getOwnMetadata('annotations', this.component);

    if (!Array.isArray(annotations)) {
      throw Error(`OriginalTemplateDirective: Annotations not available for type '${this.componentName}'`);
    }

    return annotations;
  }

}
