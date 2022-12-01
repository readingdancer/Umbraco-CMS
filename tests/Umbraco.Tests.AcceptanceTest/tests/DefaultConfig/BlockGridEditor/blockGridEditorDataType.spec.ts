import {AliasHelper, ConstantHelper, test} from '@umbraco/playwright-testhelpers';
import {expect} from "@playwright/test";
import {DataType} from "@umbraco/json-models-builders";
import {BlockGridDataTypeBuilder} from "@umbraco/json-models-builders/dist/lib/builders/dataTypes";


test.describe('BlockGridEditorContent', () => {
  const blockGridName = 'BlockGridEditorTest';
  const elementName = 'TestElement';

  const elementAlias = AliasHelper.toAlias(elementName);

  test.beforeEach(async ({page, umbracoApi, umbracoUi}) => {
    await umbracoApi.login();
    await umbracoApi.dataTypes.ensureNameNotExists(blockGridName);
  });

  test.afterEach(async ({page, umbracoApi, umbracoUi}) => {
    await umbracoApi.dataTypes.ensureNameNotExists(blockGridName);
  });

  // test('can create empty block grid editor', async ({page, umbracoApi, umbracoUi}) => {
  //   await umbracoUi.goToSection(ConstantHelper.sections.settings);
  //
  //   // Creates a new datatype
  //   await umbracoUi.clickDataElementByElementName('tree-item-dataTypes', {button: 'right'});
  //   await umbracoUi.clickDataElementByElementName(ConstantHelper.actions.create);
  //   await umbracoUi.clickDataElementByElementName(ConstantHelper.actions.dataType);
  //
  //   await umbracoUi.setEditorHeaderName(blockGridName);
  //
  //   // Adds BlockGrid as property editor
  //   await umbracoUi.clickDataElementByElementName('property-editor-add');
  //   await umbracoUi.clickDataElementByElementName('propertyeditor-', {hasText: 'Block Grid'});
  //
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
  //
  //   // Assert
  //   await expect(page.locator('.umb-notifications__notifications > .alert-success', {hasText: "Datatype saved"})).toBeVisible();
  //   // Checks if the blockGrid dataType was created
  //   await expect(await umbracoApi.dataTypes.exists(blockGridName)).toBe(true);
  //   await expect(await page.locator('[data-element="tree-item-dataTypes"] >> [data-element="tree-item-' + blockGridName + '"]')).toBeVisible();
  // });
  //
  // test('can create a block grid datatype with an element', async ({page, umbracoApi, umbracoUi}) => {
  //   await umbracoApi.documentTypes.ensureNameNotExists(elementName);
  //
  //   const blockGridType = new BlockGridDataTypeBuilder()
  //     .withName(blockGridName)
  //     .build();
  //   await umbracoApi.dataTypes.save(blockGridType);
  //
  //   await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);
  //
  //   await umbracoUi.navigateToDataType(blockGridName);
  //
  //   // Adds an element to the block grid
  //   await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_addBlockType'));
  //   await page.locator('[data-element="editor-container"]').locator('[data-element="tree-item-' + elementName + '"]').click();
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
  //
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
  //
  //   // Assert
  //   await expect(page.locator('.umb-notifications__notifications > .alert-success', {hasText: "Datatype saved"})).toBeVisible();
  //   // Checks if the elements are added
  //   await expect(page.locator('umb-block-card', {hasText: elementName})).toBeVisible();
  //   await expect(await umbracoApi.dataTypes.exists(blockGridName)).toBe(true);
  //
  //   // Clean
  //   await umbracoApi.documentTypes.ensureNameNotExists(elementName);
  // });
  //
  // test('can create block grid datatype with two elements', async ({page, umbracoApi, umbracoUi}) => {
  //   const elementNameTwo = 'SecondElement';
  //   const elementTwoAlias = AliasHelper.toAlias(elementNameTwo);
  //
  //   await umbracoApi.documentTypes.ensureNameNotExists(elementName);
  //   await umbracoApi.documentTypes.ensureNameNotExists(elementNameTwo);
  //
  //   const element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);
  //   await umbracoApi.documentTypes.createDefaultElementType(elementNameTwo, elementTwoAlias);
  //
  //   const blockGridType = new BlockGridDataTypeBuilder()
  //     .withName(blockGridName)
  //     .addBlock()
  //       .withContentElementTypeKey(element['key'])
  //     .done()
  //     .build();
  //   await umbracoApi.dataTypes.save(blockGridType);
  //
  //   await umbracoUi.navigateToDataType(blockGridName);
  //
  //   // Adds an element to the block grid
  //   await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_addBlockType'));
  //   await page.locator('[data-element="editor-container"]').locator('[data-element="tree-item-' + elementNameTwo + '"]').click();
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
  //
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
  //
  //   // Assert
  //   await expect(page.locator('.umb-notifications__notifications > .alert-success', {hasText: "Datatype saved"})).toBeVisible();
  //   // Checks if the elements are added
  //   await expect(page.locator('umb-block-card', {hasText: elementName})).toBeVisible();
  //   await expect(page.locator('umb-block-card', {hasText: elementNameTwo})).toBeVisible();
  //   await expect(await umbracoApi.dataTypes.exists(blockGridName)).toBe(true);
  //
  //   // Clean
  //   await umbracoApi.documentTypes.ensureNameNotExists(elementName);
  //   await umbracoApi.documentTypes.ensureNameNotExists(elementNameTwo);
  // });
  //
  // test('can create a block grid datatype with a element in a group', async ({page, umbracoApi, umbracoUi}) => {
  //   await umbracoApi.documentTypes.ensureNameNotExists(elementName);
  //
  //   await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);
  //
  //   const blockGridType = new BlockGridDataTypeBuilder()
  //     .withName(blockGridName)
  //     .build();
  //   await umbracoApi.dataTypes.save(blockGridType);
  //
  //   await umbracoUi.navigateToDataType(blockGridName);
  //
  //   // Creates the group
  //   await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_addBlockGroup'));
  //   await page.locator('[title="group name"]').fill('TestGroup');
  //
  //   // Adds the element to the created group
  //   await page.locator('[key="blockEditor_addBlockType"]').nth(1).click();
  //   await page.locator('[data-element="editor-container"]').locator('[data-element="tree-item-' + elementName + '"]').click();
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
  //
  //   await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
  //
  //   // Assert
  //   await expect(page.locator('.umb-notifications__notifications > .alert-success', {hasText: "Datatype saved"})).toBeVisible();
  //   // Checks if the element is added
  //   await expect(page.locator('.umb-block-card-group').nth(1).locator('umb-block-card', {hasText: elementName})).toBeVisible();
  //   await expect(await umbracoApi.dataTypes.exists(blockGridName)).toBe(true);
  //
  //   // Clean
  //   await umbracoApi.documentTypes.ensureNameNotExists(elementName);
  // });

  test('can create a block grid datatype with multiple groups and multiple element in each', async ({page, umbracoApi, umbracoUi}) => {
    const elementNameTwo = 'SecondElement';
    const elementTwoAlias = AliasHelper.toAlias(elementNameTwo);

    const elementNameThree = 'ThirdElement';
    const elementThreeAlias = AliasHelper.toAlias(elementNameThree);
    
    await umbracoApi.documentTypes.ensureNameNotExists(elementName);
    await umbracoApi.documentTypes.ensureNameNotExists(elementNameTwo);
    await umbracoApi.documentTypes.ensureNameNotExists(elementNameThree);

    const element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);
    const elementTwo = await umbracoApi.documentTypes.createDefaultElementType(elementNameTwo, elementTwoAlias);
    const elementThree= await umbracoApi.documentTypes.createDefaultElementType(elementNameThree, elementThreeAlias);
    
    const blockGridType = new BlockGridDataTypeBuilder()
      .withName(blockGridName)
      .addBlockGroups()
        .withName('testGroup')
      .done()
      .addBlockGroups()
        .withName('Groups')
      .done()
      .addBlock()
        .addColumnSpanOptions(2)
        .addColumnSpanOptions(5)
        .addColumnSpanOptions(10)
        .withContentElementTypeKey(element['key'])
        .withSettingsElementTypeKey(elementTwo['key'])
        .withLabel('LabelWeGood')
        .withBackgroundColor('#f1c232')
        .withAllowAtRoot(false)
        .withAllowInAreas(false)
        .withRowMinSpan(2)
        .withRowMaxSpan(2)
        .withAreaGridColumns(2)
        .withIconColor('#f1c232')
        .withEditorSize('small')
        .withForceHideContentEditorInOverlay(true)
        .withGroupName('Groups')
        .addArea()
          .addAreaKey()
          .withAlias('HejAlias')
          .withColumnSpan(6)
          // .withRowSpan(6)
          // .withMinAllowed(1)
          // .withMaxAllowed(20)
          // .withCreateLabel('Test')
          // .addSpecifiedAllowance()
          //   .withElementTypeKey(element['key'])
          //   .withMin(1)
          //   .withMax(20)
          //   .withMinAllowed(0)
          //   .withMaxAllowed(25)
          // .done()
        .done()
      .done()
      .build();
    const blockGridEditor = await umbracoApi.dataTypes.save(blockGridType);
    
    // There is a problem with the area.key
    
    console.log(blockGridEditor);
    // console.log(blockGridEditor.preValues[0]);
    
    await umbracoUi.navigateToDataType(blockGridName);

    await page.pause();
  });
});