import {AliasHelper, ConstantHelper, test} from "@umbraco/playwright-testhelpers";
import {BlockGridDataTypeBuilder} from "@umbraco/json-models-builders/dist/lib/builders/dataTypes";
import {expect} from "@playwright/test";

test.describe('Areas', () => {
  const blockGridName = 'BlockGridEditorTest';
  const elementName = 'TestElement';
  const elementAlias = AliasHelper.toAlias(elementName);

  test.beforeEach(async ({page, umbracoApi}, testInfo) => {
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
      .build();
    await umbracoApi.dataTypes.save(blockGridType);

    return element;
  }

  test('can add an area with an alias', async ({page, umbracoApi, umbracoUi}) => {
    const alias = 'TheAlias';

    const element = await createDefaultBlockGridWithElement(umbracoApi);

    await umbracoUi.navigateToDataType(blockGridName);

    // Adds an alias to the area
    await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    await umbracoUi.clickDataElementByElementName('sub-view-areas');
    await umbracoUi.clickElement(umbracoUi.getButtonByKey(ConstantHelper.buttons.add));
    await page.locator('[name="alias"]').fill(alias);
    await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
    await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

    // Assert
    await umbracoUi.isSuccessNotificationVisible();
    // Checks if the area was added
    await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    await umbracoUi.clickDataElementByElementName('sub-view-areas');
    await expect(page.locator('umb-block-grid-configuration-area-entry', {hasText: alias})).toBeVisible();
  });

  test('can add multiple areas', async ({page, umbracoApi, umbracoUi}) => {
    const aliasOne = 'TheAlias';
    const aliasTwo = 'TheSecondAlias';

    const element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);

    const blockGridType = new BlockGridDataTypeBuilder()
      .withName(blockGridName)
      .addBlock()
        .withContentElementTypeKey(element['key'])
        .addArea()
          .withAlias(aliasOne)
          .withColumnSpan(6)
        .done()
      .done()
      .build();
    await umbracoApi.dataTypes.save(blockGridType);

    await umbracoUi.navigateToDataType(blockGridName);

    // Adds another alias to the area
    await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    await umbracoUi.clickDataElementByElementName('sub-view-areas');
    await umbracoUi.clickElement(umbracoUi.getButtonByKey(ConstantHelper.buttons.add));
    await page.locator('[name="alias"]').fill(aliasTwo);
    await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
    await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

    // Assert
    await umbracoUi.isSuccessNotificationVisible();
    // Checks if the areas were added
    await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    await umbracoUi.clickDataElementByElementName('sub-view-areas');
    await expect(page.locator('umb-block-grid-configuration-area-entry')).toHaveCount(2);
    await expect(page.locator('umb-block-grid-configuration-area-entry', {hasText: aliasOne})).toBeVisible();
    await expect(page.locator('umb-block-grid-configuration-area-entry', {hasText: aliasTwo})).toBeVisible();
  });

  test('can update grid columns for areas', async ({page, umbracoApi, umbracoUi}) => {
    const columnValue = '6';

    const element = await createDefaultBlockGridWithElement(umbracoApi);

    await umbracoUi.navigateToDataType(blockGridName);

    // Updates the number og grid columns for areas
    await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    await umbracoUi.clickDataElementByElementName('sub-view-areas');
    await page.locator('[name="areaGridColumns"]').fill(columnValue);
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

    // Assert
    await umbracoUi.isSuccessNotificationVisible();
    // Checks if the grid columns were updated in the block
    await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    await umbracoUi.clickDataElementByElementName('sub-view-areas');
    await expect(page.locator('input[name="areaGridColumns"]')).toHaveValue(columnValue);
  });
  
 // The test does not work, dragging and dropping is not possible
 //  test('can move areas', async ({page, umbracoApi, umbracoUi}) => {
 //    const aliasOne = 'TheAlias';
 //    const aliasTwo = 'TheSecondAlias';
 //
 //    const element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);
 //
 //    const blockGridType = new BlockGridDataTypeBuilder()
 //      .withName(blockGridName)
 //      .addBlock()
 //        .withContentElementTypeKey(element['key'])
 //        .addArea()
 //          .withAlias(aliasOne)
 //          .withColumnSpan(6)
 //        .done()
 //        .addArea()
 //          .withAlias(aliasTwo)
 //          .withColumnSpan(6)
 //        .done()
 //      .done()
 //      .build();
 //    await umbracoApi.dataTypes.save(blockGridType);
 //
 //    await umbracoUi.navigateToDataType(blockGridName);
 //
 //    await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
 //    await umbracoUi.clickDataElementByElementName('sub-view-areas');
 //
 //    // First try for dragging and dropping
 //    // await page.locator('umb-block-grid-configuration-area-entry', {hasText: aliasOne}).dragTo(page.locator('umb-block-grid-configuration-area-entry', {hasText: aliasTwo}));
 //
 //    // Second try for dragging and dropping
 //    // await page.locator('umb-block-grid-configuration-area-entry', {hasText: aliasOne}).hover();
 //    // await page.mouse.down();
 //    //
 //    // await page.locator('umb-block-grid-configuration-area-entry', {hasText: aliasTwo}).locator('[title="Configure area"]').hover();
 //    //
 //    // await page.mouse.up();
 //  });
  
  test('can delete an area', async ({page, umbracoApi, umbracoUi}) => {
    const alias = 'TheAlias';

    const element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);

    const blockGridType = new BlockGridDataTypeBuilder()
      .withName(blockGridName)
      .addBlock()
        .withContentElementTypeKey(element['key'])
        .addArea()
          .withAlias(alias)
          .withColumnSpan(6)
        .done()
      .done()
      .build();
    await umbracoApi.dataTypes.save(blockGridType);

    await umbracoUi.navigateToDataType(blockGridName);

    // Deletes the area from the block
    await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    await umbracoUi.clickDataElementByElementName('sub-view-areas');
    await page.locator('umb-block-grid-configuration-area-entry', {hasText: alias}).locator('[title="Delete area"]').click();
    // We cant use the constantHelper because the label-key should be action and not actions
    await page.locator('[label-key="actions_delete"]').click();
    await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

    // Assert
    await umbracoUi.isSuccessNotificationVisible();
    // Checks if the area was deleted
    await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
    await umbracoUi.clickDataElementByElementName('sub-view-areas');
    await expect(page.locator('umb-block-grid-configuration-area-entry')).toHaveCount(0);
    await expect(page.locator('umb-block-grid-configuration-area-entry', {hasText: alias})).not.toBeVisible();
  });

  test.describe('Identification', () => {

    test('can update the alias to an area', async ({page, umbracoApi, umbracoUi}) => {
      const alias = 'TheAlias';
      const newAlias = 'TheCoolAlias';

      const element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);

      const blockGridType = new BlockGridDataTypeBuilder()
        .withName(blockGridName)
        .addBlock()
          .withContentElementTypeKey(element['key'])
          .addArea()
            .withAlias(alias)
          .done()
        .done()
        .build();
      await umbracoApi.dataTypes.save(blockGridType);

      await umbracoUi.navigateToDataType(blockGridName);

      // Updates the area alias in the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await page.locator('umb-block-grid-configuration-area-entry', {hasText: alias}).click();
      await page.locator('[name="alias"]').fill(newAlias);
      await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the new alias was added to the area
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await expect(page.locator('umb-block-grid-configuration-area-entry', {hasText: newAlias})).toBeVisible();
      await expect(page.locator('umb-block-grid-configuration-area-entry', {hasText: alias})).not.toBeVisible();
    });

    test('can add create button label to an area', async ({page, umbracoApi, umbracoUi}) => {
      const alias = 'TheAlias';
      const buttonLabel = 'TestButton';

      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // adds a create button label to the area
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await umbracoUi.clickElement(umbracoUi.getButtonByKey(ConstantHelper.buttons.add));
      await page.locator('[name="alias"]').fill(alias);
      await page.locator('[name="createLabel"]').fill(buttonLabel);
      await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the create button label was added to the area
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await page.locator('umb-block-grid-configuration-area-entry', {hasText: alias}).click();
      await expect(page.locator('input[name="createLabel"]')).toHaveValue(buttonLabel);
    });
  });

  test.describe('Validation', () => {

    test('can add a min and max number of blocks to an area', async ({page, umbracoApi, umbracoUi}) => {
      const alias = 'TheAlias';
      const minBlocks = '2';
      const maxBlocks = '5';

      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds an area
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await umbracoUi.clickElement(umbracoUi.getButtonByKey(ConstantHelper.buttons.add));
      await page.locator('[name="alias"]').fill(alias);

      // Adds the min and max
      await page.locator('[name="minMaxEditor"] >> [name="numberFieldMin"]').fill(minBlocks);
      await page.locator('[name="minMaxEditor"] >> [name="numberFieldMax"]').fill(maxBlocks);
      await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if min and max was added to the areas
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await page.locator('umb-block-grid-configuration-area-entry', {hasText: alias}).click();
      await expect(page.locator('[name="minMaxEditor"] >> input[name="numberFieldMin"]')).toHaveValue(minBlocks);
      await expect(page.locator('[name="minMaxEditor"] >> input[name="numberFieldMax"]')).toHaveValue(maxBlocks);
    });

    test('min cant be a higher number than max for number of blocks to an area', async ({page, umbracoApi, umbracoUi}) => {
      const alias = "TheAlias";
      const minBlocks = '4';
      const maxBlocks = '3';

      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds an area
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await umbracoUi.clickElement(umbracoUi.getButtonByKey(ConstantHelper.buttons.add));
      await page.locator('[name="alias"]').fill(alias);
      // Adds the min and max
      await page.locator('[name="minMaxEditor"] >> [name="numberFieldMin"]').fill(minBlocks);
      await page.locator('[name="minMaxEditor"] >> [name="numberFieldMax"]').fill(maxBlocks);
      await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();

      // Assert
      // When we try to submit the changes when min is higher than max, nothing happens. 
      // That's why we now try to check if the submit button is still visible, if the button is visible then the area was not saved.
      await expect(page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']')).toBeVisible();
    });

    test('can add allowed block types with min and max to an area', async ({page, umbracoApi, umbracoUi}) => {
      const alias = 'TheAlias';
      const minValue = '2';
      const maxValue = '4';

      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds an area
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await umbracoUi.clickElement(umbracoUi.getButtonByKey(ConstantHelper.buttons.add));
      await page.locator('[name="alias"]').fill(alias);

      // Adds the allowed block types
      await page.locator('umb-block-grid-area-allowance-editor').locator('[key="' + ConstantHelper.buttons.add + '"]').click();
      await page.locator('[title="Pick group or Block"]').click();

      await page.selectOption('select[title="Pick group or Block"]', {label: elementName});
      await page.locator('[title="Set a minimum requirement"]').fill(minValue);
      await page.locator('[title="Set a maximum requirement"]').fill(maxValue);

      await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if an area was added
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await page.locator('umb-block-grid-configuration-area-entry', {hasText: alias}).click();
      // Checks if the correct block was added and if the min and max values are correct
      await expect(page.locator('[selected="selected"]')).toHaveText(elementName);
      await expect(page.locator('input[title="Set a minimum requirement"]')).toHaveValue(minValue);
      await expect(page.locator('input[title="Set a maximum requirement"]')).toHaveValue(maxValue);
    });

    test('can add a block and a group to the allowed block types with min and max to an area', async ({page, umbracoApi, umbracoUi}) => {
      const alias = 'TheAlias';
      const minValue = '1';
      const maxValue = '5';
      const groupName = "TheAllowedGroup";

      const element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);

      const blockGridType = new BlockGridDataTypeBuilder()
        .withName(blockGridName)
        .addBlockGroups()
        .withName(groupName)
        .done()
        .addBlock()
          .withContentElementTypeKey(element['key'])
          .addArea()
            .withAlias(alias)
            .addSpecifiedAllowance()
              .withGroupName(groupName)
              .withMinAllowed(2)
              .withMaxAllowed(8)
            .done()
          .done()
        .done()
        .build();
      await umbracoApi.dataTypes.save(blockGridType);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds an area
      // The reason we need a :visible is because there is another data-content-element-type-key of the element in the next group, but it is not visible
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]:visible').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await page.locator('umb-block-grid-configuration-area-entry', {hasText: alias}).click();

      // Adds the allowed block types
      await page.locator('umb-block-grid-area-allowance-editor').locator('[key=' + ConstantHelper.buttons.add + ']').click();

      // We need to use nth and last() so we can get the correct elements.
      await page.locator('[title="Pick group or Block"]').last().click();
      await page.selectOption('select[title="Pick group or Block"] >> nth=-1', {label: elementName});

      // Adds min and max
      await page.locator('[title="Set a minimum requirement"]').last().fill(minValue);
      await page.locator('[title="Set a maximum requirement"]').last().fill(maxValue);

      await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]:visible').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await page.locator('umb-block-grid-configuration-area-entry', {hasText: alias}).click();
      // Checks if the correct block was added and if the min and max values are correct
      await expect(page.locator('[selected="selected"]').last()).toHaveText(elementName);
      await expect(page.locator('input[title="Set a minimum requirement"]').last()).toHaveValue(minValue);
      await expect(page.locator('input[title="Set a maximum requirement"]').last()).toHaveValue(maxValue);
    });

    test('can remove a block in allowed block types of an area', async ({page, umbracoApi, umbracoUi}) => {
      const alias = 'TheAlias';

      const element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);

      const blockGridType = new BlockGridDataTypeBuilder()
        .withName(blockGridName)
        .addBlock()
          .withContentElementTypeKey(element['key'])
          .addArea()
            .withAlias(alias)
            .addSpecifiedAllowance()
              .withElementTypeKey(element['key'])
            .done()
          .done()
        .done()
        .build();
      await umbracoApi.dataTypes.save(blockGridType);

      await umbracoUi.navigateToDataType(blockGridName);

      // Removes the allowed block type
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await page.locator('umb-block-grid-configuration-area-entry', {hasText: alias}).click();
      await page.locator('umb-block-grid-area-allowance-editor').locator('[title="Delete"]').click();
      await page.locator('[name="blockGridBlockConfigurationAreaForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await page.locator('[name="blockGridBlockConfigurationForm"] >> [label-key=' + ConstantHelper.buttons.submitChanges + ']').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the allowed block type was deleted
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-areas');
      await page.locator('umb-block-grid-configuration-area-entry', {hasText: alias}).click();
      await expect(page.locator('[title="Pick group or Block"]')).not.toBeVisible();
    });
  });
});