import {AliasHelper, ConstantHelper, test} from "@umbraco/playwright-testhelpers";
import {BlockGridDataTypeBuilder} from "@umbraco/json-models-builders/dist/lib/builders/dataTypes";
import {expect} from "@playwright/test";

test.describe('Areas', () => {
  const blockGridName = 'BlockGridEditorTest';
  const elementName = 'TestElement';

  const elementAlias = AliasHelper.toAlias(elementName);

  test.beforeEach(async ({ page, umbracoApi }, testInfo) => {
    await umbracoApi.report.report(testInfo);
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

  // test('can update grid columns for areas', async ({page, umbracoApi, umbracoUi}) => {
  //   const element = await createDefaultBlockGridWithElement(umbracoApi);
  //
  //   await umbracoUi.navigateToDataType(blockGridName);
  //
  //   // Updates the number og grid columns for areas
  //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
  //   await umbracoUi.clickDataElementByElementName('sub-view-areas');
  //   await page.locator('[name="areaGridColumns"]').fill('6');
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey('buttons_submitChanges'));
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
  //
  //   // Assert
  //   await umbracoUi.isSuccessNotificationVisible({timeout: 10000});
  //   await expect(page.locator('input[name="areaGridColumns"]')).toHaveValue('6');
  // });
  //
  // test('can add areas', async ({page, umbracoApi, umbracoUi}) => {
  //
  // });

  test.describe('Inside Areas', () => {
    
    // test('can add alias to an area', async ({page, umbracoApi, umbracoUi}) => {
    //   const alias = 'TheAlias';
    //
    //   const element = await createDefaultBlockGridWithElement(umbracoApi);
    //
    //   await umbracoUi.navigateToDataType(blockGridName);
    //
    //   // Adds an alias to the area
    //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    //   await umbracoUi.clickDataElementByElementName('sub-view-areas');
    //   await umbracoUi.clickElement(umbracoUi.getButtonByKey(ConstantHelper.buttons.add));
    //   await page.locator('[name="alias"]').fill(alias);
    //
    //
    //   await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key="buttons_submitChanges"]').click();
    //   await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key="buttons_submitChanges"]').click();
    //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
    //
    //   // Assert
    //   await umbracoUi.isSuccessNotificationVisible({timeout: 10000});
    //   // Checks if an area was added
    //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    //   await umbracoUi.clickDataElementByElementName('sub-view-areas');
    //   await expect(page.locator('umb-block-grid-configuration-area-entry', {hasText: alias})).toBeVisible();
    // });
    //
    // test('can add create button label to an area', async ({page, umbracoApi, umbracoUi}) => {
    //   const alias = 'TheAlias';
    //   const buttonLabel = 'TestButton';
    //
    //   const element = await createDefaultBlockGridWithElement(umbracoApi);
    //
    //   await umbracoUi.navigateToDataType(blockGridName);
    //
    //   // adds a create button label to the area
    //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    //   await umbracoUi.clickDataElementByElementName('sub-view-areas');
    //   await umbracoUi.clickElement(umbracoUi.getButtonByKey(ConstantHelper.buttons.add));
    //   await page.locator('[name="alias"]').fill(alias);
    //   await page.locator('[name="createLabel"]').fill(buttonLabel);
    //  
    //   await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key="buttons_submitChanges"]').click();
    //   await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key="buttons_submitChanges"]').click();
    //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
    //
    //   // Assert
    //   await umbracoUi.isSuccessNotificationVisible({timeout: 10000});
    //   // Checks if an area was added
    //   await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    //   await umbracoUi.clickDataElementByElementName('sub-view-areas');
    //   await page.locator('umb-block-grid-configuration-area-entry', {hasText: alias}).click();
    //   await expect(page.locator('input[name="createLabel"]')).toHaveValue(buttonLabel);
    // });

    test('can add min and max number of blocks to an area', async ({page, umbracoApi, umbracoUi}) => {
      const alias = 'TheAlias';
      const minBlocks = '2';
      const maxBlocks = '5';
      
      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // adds a create button label to the area
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await umbracoUi.clickElement(umbracoUi.getButtonByKey(ConstantHelper.buttons.add));
      await page.locator('[name="alias"]').fill(alias);
      
      await page.locator('[name="minMaxEditor"] >> [name="numberFieldMin"]').fill(minBlocks);
      await page.locator('[name="minMaxEditor"] >> [name="numberFieldMax"]').fill(maxBlocks);

      await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key="buttons_submitChanges"]').click();
      await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key="buttons_submitChanges"]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible({timeout: 10000});
      // Checks if an area was added
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await page.locator('umb-block-grid-configuration-area-entry', {hasText: alias}).click();
      await expect(page.locator('[name="minMaxEditor"] >> input[name="numberFieldMin"]')).toHaveValue(minBlocks);
      await expect(page.locator('[name="minMaxEditor"] >> input[name="numberFieldMax"]')).toHaveValue(maxBlocks);
    });

    test('can add allowed block types to an area', async ({page, umbracoApi, umbracoUi}) => {
    
    
    });
  });
});