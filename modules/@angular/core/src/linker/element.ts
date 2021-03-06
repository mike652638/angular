/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injector} from '../di/injector';
import {isPresent} from '../facade/lang';

import {ElementRef} from './element_ref';
import {QueryList} from './query_list';
import {AppView} from './view';
import {ViewContainerRef_} from './view_container_ref';
import {ViewType} from './view_type';


/**
 * An AppElement is created for elements that have a ViewContainerRef,
 * a nested component or a <template> element to keep data around
 * that is needed for later instantiations.
 */
export class AppElement {
  public nestedViews: AppView<any>[];
  public componentView: AppView<any>;

  public component: any;

  constructor(
      public index: number, public parentIndex: number, public parentView: AppView<any>,
      public nativeElement: any) {}

  get elementRef(): ElementRef { return new ElementRef(this.nativeElement); }

  get vcRef(): ViewContainerRef_ { return new ViewContainerRef_(this); }

  initComponent(component: any, view: AppView<any>) {
    this.component = component;
    this.componentView = view;
  }

  get parentInjector(): Injector { return this.parentView.injector(this.parentIndex); }
  get injector(): Injector { return this.parentView.injector(this.index); }

  detectChangesInNestedViews(throwOnChange: boolean): void {
    if (this.nestedViews) {
      for (var i = 0; i < this.nestedViews.length; i++) {
        this.nestedViews[i].detectChanges(throwOnChange);
      }
    }
  }

  destroyNestedViews(): void {
    if (this.nestedViews) {
      for (var i = 0; i < this.nestedViews.length; i++) {
        this.nestedViews[i].destroy();
      }
    }
  }

  visitNestedViewRootNodes<C>(cb: (node: any, ctx: C) => void, c: C): void {
    if (this.nestedViews) {
      for (var i = 0; i < this.nestedViews.length; i++) {
        this.nestedViews[i].visitRootNodesInternal(cb, c);
      }
    }
  }

  mapNestedViews(nestedViewClass: any, callback: Function): any[] {
    var result: any[] /** TODO #9100 */ = [];
    if (isPresent(this.nestedViews)) {
      this.nestedViews.forEach((nestedView) => {
        if (nestedView.clazz === nestedViewClass) {
          result.push(callback(nestedView));
        }
      });
    }
    return result;
  }

  moveView(view: AppView<any>, currentIndex: number) {
    var previousIndex = this.nestedViews.indexOf(view);
    if (view.type === ViewType.COMPONENT) {
      throw new Error(`Component views can't be moved!`);
    }
    var nestedViews = this.nestedViews;
    if (nestedViews == null) {
      nestedViews = [];
      this.nestedViews = nestedViews;
    }
    nestedViews.splice(previousIndex, 1);
    nestedViews.splice(currentIndex, 0, view);
    var refRenderNode: any /** TODO #9100 */;
    if (currentIndex > 0) {
      var prevView = nestedViews[currentIndex - 1];
      refRenderNode = prevView.lastRootNode;
    } else {
      refRenderNode = this.nativeElement;
    }
    if (isPresent(refRenderNode)) {
      view.renderer.attachViewAfter(refRenderNode, view.flatRootNodes);
    }
    view.markContentChildAsMoved(this);
  }

  attachView(view: AppView<any>, viewIndex: number) {
    if (view.type === ViewType.COMPONENT) {
      throw new Error(`Component views can't be moved!`);
    }
    var nestedViews = this.nestedViews;
    if (nestedViews == null) {
      nestedViews = [];
      this.nestedViews = nestedViews;
    }
    nestedViews.splice(viewIndex, 0, view);
    var refRenderNode: any /** TODO #9100 */;
    if (viewIndex > 0) {
      var prevView = nestedViews[viewIndex - 1];
      refRenderNode = prevView.lastRootNode;
    } else {
      refRenderNode = this.nativeElement;
    }
    if (isPresent(refRenderNode)) {
      view.renderer.attachViewAfter(refRenderNode, view.flatRootNodes);
    }
    view.addToContentChildren(this);
  }

  detachView(viewIndex: number): AppView<any> {
    const view = this.nestedViews.splice(viewIndex, 1)[0];
    if (view.type === ViewType.COMPONENT) {
      throw new Error(`Component views can't be moved!`);
    }
    view.detach();

    view.removeFromContentChildren(this);
    return view;
  }
}
