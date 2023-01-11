import {AliasHelper, ConstantHelper, test} from "@umbraco/playwright-testhelpers";
import {BlockGridDataTypeBuilder} from "@umbraco/json-models-builders/dist/lib/builders/dataTypes";
import {expect} from "@playwright/test";

test.describe('Settings', () => {
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

  test.describe('General', () => {

    test('can add a label to an element', async ({page, umbracoApi, umbracoUi}) => {
      const labelText = '{{myPropertyAlias}}';

      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds the label text
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await page.locator('[name="label"]').fill(labelText);
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the label was updated
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await expect(page.locator('input[name="label"]')).toHaveValue(labelText);
    });

    // test('can add a Content model to an element', async ({page, umbracoApi, umbracoUi}) => {
    //  I dont think we can add a Content model because the block always already has one and you cant remove it.
    // });

    test('can add a settings model to a block', async ({page, umbracoApi, umbracoUi}) => {
      const elementNameTwo = 'TheSettingsElement';
      const elementTwoAlias = AliasHelper.toAlias(elementNameTwo);

      await umbracoApi.documentTypes.ensureNameNotExists(elementNameTwo);
      
      await umbracoApi.documentTypes.createDefaultElementType(elementNameTwo, elementTwoAlias);
      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds the settings model to the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_addSettingsElementType'));
      await umbracoUi.clickDataElementByElementName('tree-item-' + elementNameTwo);
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey('buttons_submitChanges'));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the settings model was added
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await expect(page.locator('.__settings-input', {hasText: elementNameTwo})).toBeVisible();

      // Clean
      await umbracoApi.documentTypes.ensureNameNotExists(elementNameTwo);
    });

    test('can remove a settings model for a block', async ({page, umbracoApi, umbracoUi}) => {
      const element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);

      const blockGridType = new BlockGridDataTypeBuilder()
        .withName(blockGridName)
        .addBlock()
          .withContentElementTypeKey(element['key'])
          .withSettingsElementTypeKey(element['key'])
        .done()
        .build();
      await umbracoApi.dataTypes.save(blockGridType);

      await umbracoUi.navigateToDataType(blockGridName);

      // Removes the settings model to the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await page.locator('.__settings-input', {hasText: elementName}).locator('[icon="icon-wrong"]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.actions.remove));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the settings model was added
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      // If the button add settings model is visible it means that the setting was removed
      await expect(page.locator('[key="blockEditor_addSettingsElementType"]')).toBeVisible();
    });
  });

  test.describe('Permissions', () => {

    test('can disallow a block in root', async ({page, umbracoApi, umbracoUi}) => {
      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Clicks the allow in root button
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await page.locator('[id="allowAtRoot"]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      // Asserts that the button allow in root is false
      await expect(page.locator('.umb-el-wrap', {hasText: "Allow in root"}).locator('[aria-checked="false"]')).toBeVisible();
    })

    test('can disallow a block in areas', async ({page, umbracoApi, umbracoUi}) => {
      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Clicks the allow in areas button
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await page.locator('[id="allowInAreas"]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      // Asserts that the button allow in root is false
      await expect(page.locator('.umb-el-wrap', {hasText: "Allow in areas"}).locator('[aria-checked="false"]')).toBeVisible();
    });
  });

  test.describe('Size options', () => {

    test('can show resize options', async ({page, umbracoApi, umbracoUi}) => {
      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Click the show size options
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_showSizeOptions'));

      // Assert
      // Available columns spans and Available row spans should be visible after clicking show size options
      await expect(page.locator('[key="blockEditor_allowedBlockColumns"]')).toBeVisible();
      await expect(page.locator('[key="blockEditor_allowedBlockRows"]')).toBeVisible();
    });

    test('can add an available column span', async ({page, umbracoApi, umbracoUi}) => {
      const element = await createDefaultBlockGridWithElement(umbracoApi);
      const columnSpan = "5";

      await umbracoUi.navigateToDataType(blockGridName);

      // Click the show size options
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_showSizeOptions'));
      // Adds the column span
      await page.locator('umb-block-grid-column-editor-option', {hasText: columnSpan}).locator('button').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      // Sometimes the button show size option is not there, so we need to check the count before trying to click it.
      const showSizeOptionsCount = await page.locator('[key="blockEditor_showSizeOptions"]').count();
      if (showSizeOptionsCount == 1) {
        await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_showSizeOptions'));
      }
      // Checks if it is possible to remove the columnSpan. 
      await expect(page.locator('umb-block-grid-column-editor-option', {hasText: columnSpan}).locator('[key=' + ConstantHelper.buttons.remove + ']')).toBeVisible();
    });

    test('can add multiple available column spans', async ({page, umbracoApi, umbracoUi}) => {
      const element = await createDefaultBlockGridWithElement(umbracoApi);
      const columnSpanThree = "3";
      const columnSpanSix = "6";
      const columnSpanNine = "9";

      await umbracoUi.navigateToDataType(blockGridName);

      // Click the show size options
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_showSizeOptions'));

      // Adds multiple column spans
      await page.locator('umb-block-grid-column-editor-option', {hasText: columnSpanThree}).locator('button').click();
      await page.locator('umb-block-grid-column-editor-option', {hasText: columnSpanSix}).locator('button').click();
      await page.locator('umb-block-grid-column-editor-option', {hasText: columnSpanNine}).locator('button').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      // Sometimes the button show size option is not there, so we need to check the count before trying to click it.
      const showSizeOptionsCount = await page.locator('[key="blockEditor_showSizeOptions"]').count();
      if (showSizeOptionsCount == 1) {
        await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_showSizeOptions'));
      }
      // Checks if it is possible to remove the columnSpans, which means they have been added. 
      await expect(page.locator('umb-block-grid-column-editor-option', {hasText: columnSpanThree}).locator('[key=' + ConstantHelper.buttons.remove + ']')).toBeVisible();
      await expect(page.locator('umb-block-grid-column-editor-option', {hasText: columnSpanSix}).locator('[key=' + ConstantHelper.buttons.remove + ']')).toBeVisible();
      await expect(page.locator('umb-block-grid-column-editor-option', {hasText: columnSpanNine}).locator('[key=' + ConstantHelper.buttons.remove + ']')).toBeVisible();
    });

    test('can update available row spans', async ({page, umbracoApi, umbracoUi}) => {
      const element = await createDefaultBlockGridWithElement(umbracoApi);
      const minValue = "2";
      const maxValue = "12";

      await umbracoUi.navigateToDataType(blockGridName);

      // Click the show size options
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_showSizeOptions'));

      // Updates min and max
      await page.locator('[name="rowMinMaxModel"] >> [name="numberFieldMin"]').fill(minValue);
      await page.locator('[name="rowMinMaxModel"] >> [name="numberFieldMax"]').fill(maxValue);
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      // Sometimes the button show size option is not there, so we need to check the count before trying to click it.
      const showSizeOptionsCount = await page.locator('[key="blockEditor_showSizeOptions"]').count();
      if (showSizeOptionsCount == 1) {
        await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_showSizeOptions'));
      }
      // Checks if min and max contains the correct values
      await expect(page.locator('[name="rowMinMaxModel"]').locator('input[name="numberFieldMin"]')).toHaveValue(minValue);
      await expect(page.locator('[name="rowMinMaxModel"]').locator('input[name="numberFieldMax"]')).toHaveValue(maxValue);
    });

    test('min cant be more than max for the available row spans', async ({page, umbracoApi, umbracoUi}) => {
      const element = await createDefaultBlockGridWithElement(umbracoApi);
      const minValue = "9";
      const maxValue = "6";

      await umbracoUi.navigateToDataType(blockGridName);

      // Click the show size options
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_showSizeOptions'));

      // Updates min and max
      await page.locator('[name="rowMinMaxModel"] >> [name="numberFieldMin"]').fill(minValue);
      await page.locator('[name="rowMinMaxModel"] >> [name="numberFieldMax"]').fill(maxValue);
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      // Sometimes the button show size option is not there, so we need to check the count before trying to click it.
      const showSizeOptionsCount = await page.locator('[key="blockEditor_showSizeOptions"]').count();
      if (showSizeOptionsCount == 1) {
        await umbracoUi.clickElement(umbracoUi.getButtonByKey('blockEditor_showSizeOptions'));
      }
      // When the min is saved as a number larger than the max value the min value is reset to 1, that is why we check if the value is 1 in min
      await expect(page.locator('[name="rowMinMaxModel"]').locator('input[name="numberFieldMin"]')).toHaveValue("1");
      await expect(page.locator('[name="rowMinMaxModel"]').locator('input[name="numberFieldMax"]')).toHaveValue(maxValue);
    });
  });
});