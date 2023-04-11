import {AliasHelper, ConstantHelper, test} from '@umbraco/playwright-testhelpers';
import {expect} from "@playwright/test";
import {MediaBuilder, MediaFileBuilder, StylesheetBuilder} from "@umbraco/json-models-builders";
import {BlockListDataTypeBuilder} from "@umbraco/json-models-builders/dist/lib/builders/dataTypes";

test.describe('BlockListEditorDataType', () => {
  const blockListName = 'BlockListTest';
  const elementName = 'TestElement';
  
  const elementAlias = AliasHelper.toAlias(elementName);
  
  test.beforeEach(async ({page, umbracoApi, umbracoUi}, testInfo) => {
    await umbracoApi.report.report(testInfo);
    await umbracoApi.login();
    await umbracoApi.dataTypes.ensureNameNotExists(blockListName);
    await umbracoApi.documentTypes.ensureNameNotExists(elementName);
  });
  
  test.afterEach(async({page, umbracoApi, umbracoUi}) => {
    await umbracoApi.dataTypes.ensureNameNotExists(blockListName);
    await umbracoApi.documentTypes.ensureNameNotExists(elementName);
  })

  test('can create a block list datatype with an element', async ({page, umbracoApi, umbracoUi}) => {
    await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);

    const blockListType = new BlockListDataTypeBuilder()
      .withName(blockListName)
      .build();
    await umbracoApi.dataTypes.save(blockListType);

    await umbracoUi.navigateToDataType(blockListName);

    // Adds an element to the block list
    await umbracoUi.clickElement(umbracoUi.getButtonByKey(ConstantHelper.buttons.add));
    await page.locator('[data-element="editor-container"]').locator('[data-element="tree-item-' + elementName + '"]').click();
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

    // Assert
    await expect(page.locator('.umb-notifications__notifications > .alert-success', {hasText: "Datatype saved"})).toBeVisible();
    // Checks if the element is added
    await expect(page.locator('.umb-block-card-grid', {hasText: elementName})).toBeVisible();
  });
});