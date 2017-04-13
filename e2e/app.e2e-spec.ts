import { NgOriginalTemplatePage } from './app.po';

describe('ng-original-template App', () => {
  let page: NgOriginalTemplatePage;

  beforeEach(() => {
    page = new NgOriginalTemplatePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
