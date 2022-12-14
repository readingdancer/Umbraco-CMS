import {AliasHelper, ConstantHelper, test} from "@umbraco/playwright-testhelpers";
import {BlockGridDataTypeBuilder} from "@umbraco/json-models-builders/dist/lib/builders/dataTypes";
import {expect} from "@playwright/test";
import {MediaBuilder, MediaFileBuilder} from "@umbraco/json-models-builders";

test.describe('Settings', () => {
  const blockGridName = 'BlockGridEditorTest';
  const elementName = 'TestElement';

  const elementAlias = AliasHelper.toAlias(elementName);

  test.beforeEach(async ({ page, umbracoApi }, testInfo) => {
    await umbracoApi.report.report(testInfo);
    await umbracoApi.login();
    await umbracoApi.dataTypes.ensureNameNotExists(blockGridName);
    await umbracoApi.documentTypes.ensureNameNotExists(elementName);
  });

  test.afterEach(async ({page, umbracoApi, umbracoUi}) => {
    await umbracoApi.dataTypes.ensureNameNotExists(blockGridName);
    await umbracoApi.documentTypes.ensureNameNotExists(elementName);
  });

  async function createDefaultBlockGridWithElement(umbracoApi) {
    const element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);

    const blockGridType = new BlockGridDataTypeBuilder()
      .withName(blockGridName)
      .addBlock()
        .withContentElementTypeKey(element['key'])
      .done()
      .build()
    await umbracoApi.dataTypes.save(blockGridType);

    return element;
  }
  
  // test('can add a label to an element', async ({page, umbracoApi, umbracoUi}) => {
  //   const labelText = '{{myPropertyAlias}}';
  //
  //   const element = await createDefaultBlockGridWithElement(umbracoApi);
  //
  //   await umbracoUi.navigateToDataType(blockGridName);
  //
  //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
  //
  //   await page.locator('[name="label"]').fill(labelText);
  //
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey('buttons_submitChanges'));
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
  //
  //   // Assert
  //   await umbracoUi.isSuccessNotificationVisible({timeout: 10000});
  //   // Checks if the label was updated
  //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
  //   await expect(page.locator('input[name="label"]')).toHaveValue(labelText);
  // });
  //
  // test('can add a Content model to an element', async ({page, umbracoApi, umbracoUi}) => {
  //   // I dont think I can add a Content model because it always already has one and you cant remove it.
  // });
  //
  // test('can add a settings model to a block', async ({page, umbracoApi, umbracoUi}) => {
  //   const elementNameTwo = 'TheSettingsElement';
  //   const elementTwoAlias = AliasHelper.toAlias(elementNameTwo);
  //  
  //   await umbracoApi.documentTypes.ensureNameNotExists(elementNameTwo);
  //  
  //   await umbracoApi.documentTypes.createDefaultElementType(elementNameTwo, elementTwoAlias);
  //
  //   const element = await createDefaultBlockGridWithElement(umbracoApi);
  //
  //   await umbracoUi.navigateToDataType(blockGridName);
  //
  //   // Adds the settings model to the block
  //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
  //   await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_addSettingsElementType'));
  //   await umbracoUi.clickDataElementByElementName('tree-item-' + elementNameTwo);
  //
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey('buttons_submitChanges'));
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
  //
  //   // Assert
  //   await umbracoUi.isSuccessNotificationVisible({timeout: 10000});
  //   // Checks if the settings model was added
  //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
  //   await expect(page.locator('.__settings-input', {hasText: elementNameTwo})).toBeVisible();
  //
  //   // Clean
  //   await umbracoApi.documentTypes.ensureNameNotExists(elementNameTwo);
  // });
  //
  // test('can remove a settings model for a block', async ({page, umbracoApi, umbracoUi}) => {
  //   const element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);
  //
  //   const blockGridType = new BlockGridDataTypeBuilder()
  //     .withName(blockGridName)
  //     .addBlock()
  //     .withContentElementTypeKey(element['key'])
  //     .withSettingsElementTypeKey(element['key'])
  //     .done()
  //     .build()
  //   await umbracoApi.dataTypes.save(blockGridType);
  //
  //   await umbracoUi.navigateToDataType(blockGridName);
  //
  //   // Removes the settings model to the block
  //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
  //   await page.locator('.__settings-input', {hasText: elementName}).locator('[icon="icon-wrong"]').click();
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey('actions_remove'));
  //
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey('buttons_submitChanges'));
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
  //
  //   // Assert
  //   await umbracoUi.isSuccessNotificationVisible({timeout: 10000});
  //   // Checks if the settings model was added
  //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
  //   // If the button add settings model is visible it means that the setting was removed
  //   await expect(page.locator('[key="blockEditor_addSettingsElementType"]')).toBeVisible();
  // });

  test('can disallow block in root', async ({page, umbracoApi, umbracoUi}) => {
    const element = await createDefaultBlockGridWithElement(umbracoApi);

    await umbracoUi.navigateToDataType(blockGridName);

    await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    await page.locator('[id="allowAtRoot"]').click();
    
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey('buttons_submitChanges'));
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

    // Assert
    await umbracoUi.isSuccessNotificationVisible({timeout: 10000});
    await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    await page.pause();
    // await expect(page.locator('[id="allowAtRoot"] > aria-checked="true"')).toBeVisible();
    
    // Not working proper
    // Need to assert that it is false.
    await expect(page.locator('.umb-el-wrap:has() > [aria-checked="false"]')).toBeVisible();
    
  });
  //
  // test('can disallow block in areas', async ({page, umbracoApi, umbracoUi}) => {
  //   const element = await createDefaultBlockGridWithElement(umbracoApi);
  //
  //   await umbracoUi.navigateToDataType(blockGridName);
  //
  //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
  //   await page.locator('[id="allowInAreas"]').click();
  //
  //   await page.pause();
  // });
  //
  // test('can show resize options', async ({page, umbracoApi, umbracoUi}) => {
  //   const element = await createDefaultBlockGridWithElement(umbracoApi);
  //
  //   await umbracoUi.navigateToDataType(blockGridName);
  //
  //   // Click the show size options
  //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
  //   await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_showSizeOptions'));
  //
  //   // Assert
  //   // Available columns spans and Available row spans should be visible after clicking show size options
  //   await expect(page.locator('[key="blockEditor_allowedBlockColumns"]')).toBeVisible();
  //   await expect(page.locator('[key="blockEditor_allowedBlockRows"]')).toBeVisible();
  // });
  //
  //
  // test('can add available column spans', async ({page, umbracoApi, umbracoUi}) => {
  //   const element = await createDefaultBlockGridWithElement(umbracoApi);
  //
  //   await umbracoUi.navigateToDataType(blockGridName);
  //
  //   await page.pause();
  //
  //   // Click the show size options
  //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
  //   await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_showSizeOptions'));
  //   await page.locator('')
  //   // await page.locator('.umb-block-grid-column-editor').click();
  //
  // });
  // test('can add available row spans', async ({page, umbracoApi, umbracoUi}) => {
  //   const element = await createDefaultBlockGridWithElement(umbracoApi);
  //
  //   await umbracoUi.navigateToDataType(blockGridName);
  //
  //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
  //   await page.pause();
  // });
});