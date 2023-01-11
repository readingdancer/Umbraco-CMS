import {AliasHelper, ConstantHelper, test} from "@umbraco/playwright-testhelpers";
import {BlockGridDataTypeBuilder} from "@umbraco/json-models-builders/dist/lib/builders/dataTypes";
import {expect} from "@playwright/test";
import {MediaBuilder, MediaFileBuilder, StylesheetBuilder} from "@umbraco/json-models-builders";

test.describe('Advanced', () => {
  
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

  test.describe('Advanced', () => {
    
    test('can add a custom stylesheet', async ({page, umbracoApi, umbracoUi}) => {
      const stylesheetName = 'StylesheetTest';

      await umbracoApi.stylesheets.ensureNameNotExists(stylesheetName + '.css');

      const stylesheet = new StylesheetBuilder()
        .withVirtualPath("/css/")
        .withFileType("stylesheets")
        .withName(stylesheetName)
        .build();
      await umbracoApi.stylesheets.save(stylesheet);

      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds a custom stylesheet for the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await page.locator('.umb-group-panel', {hasText: 'Advanced'}).locator('[key="blockEditor_addCustomStylesheet"]').click();
      await page.locator('[data-element="tree-item-wwwroot"]').locator('[data-element="tree-item-expand"]').click();
      await page.locator('[data-element="tree-item-css"]').locator('[data-element="tree-item-expand"]').click();
      await umbracoUi.clickDataElementByElementName('tree-item-' + stylesheetName + '.css');
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the stylesheet was added to the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await expect(page.locator('.__settings-input', {hasText: stylesheetName})).toBeVisible();

      // Clean
      await umbracoApi.stylesheets.ensureNameNotExists(stylesheetName + '.css');
    });

    test('can change overlay editor size', async ({page, umbracoApi, umbracoUi}) => {
      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Edits the overlay editor size for the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await page.selectOption('select[id="editorSize"]', {label: "Small"});
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the overlay editor size was updated in the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await expect(page.locator('[selected="selected"]')).toHaveText("Small");
    });

    test('can add inline editing mode', async ({page, umbracoApi, umbracoUi}) => {
      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds inline editing for the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await page.locator('.umb-el-wrap', {hasText: "Inline editing"}).locator('role=checkbox[checked=false]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the inline editing mode was added in the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await expect(page.locator('.umb-el-wrap', {hasText: "Inline editing"}).locator('role=checkbox[checked=true]')).toBeVisible();
    });

    test('can add hide content editor', async ({page, umbracoApi, umbracoUi}) => {
      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds hide content editor to the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await page.locator('.umb-el-wrap', {hasText: "Hide content editor"}).locator('role=checkbox[checked=false]').click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the hide content editor was added in the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await expect(page.locator('.umb-el-wrap', {hasText: "Hide content editor"}).locator('role=checkbox[checked=true]')).toBeVisible();
    });
  });

  test.describe('Catalogue Appearance', () => {

    test('can add a background color', async ({page, umbracoApi, umbracoUi}) => {
      const color = 'rgb(69, 129, 142)';

      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds a background color for the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await page.locator('.umb-el-wrap', {has: page.locator('[for="backgroundColor"]')}).locator('.sp-replacer').click();
      await page.locator('[data-color="' + color + '"]:visible').click();
      await page.locator('.sp-choose:visible', {hasText: 'Choose'}).click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the background color was added to the block
      await expect(page.locator('[data-content-element-type-key="' + element['key'] + '"]').locator('[style="background-color: ' + color + '; background-image: none;"]')).toBeVisible();
    });

    test('can add a icon color', async ({page, umbracoApi, umbracoUi}) => {
      const color = '#cc0000';

      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds a icon color for the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await page.locator('.umb-el-wrap', {has: page.locator('[for="iconColor"]')}).locator('.sp-replacer').click();
      await page.locator('[title="' + color + '"]:visible').click();
      await page.locator('.sp-choose:visible', {hasText: 'Choose'}).click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the icon color was added to the block
      await expect(page.locator('[data-content-element-type-key="' + element['key'] + '"]').locator('[style="color:' + color + '"]')).toBeVisible();
    });

    test('can add a thumbnail', async ({page, umbracoApi, umbracoUi}) => {
      const imageName = "Umbraco";
      const umbracoFileValue = {"src": "Umbraco.png"};
      const fileName = "Umbraco.png";
      const path = fileName;
      const mimeType = "image/png";

      await umbracoApi.media.ensureNameNotExists(imageName);

      const mediaItem = new MediaBuilder()
        .withName(imageName)
        .withContentTypeAlias('Image')
        .addProperty()
          .withAlias('umbracoFile')
          .withValue(umbracoFileValue)
        .done()
        .build();
      const mediaFile = new MediaFileBuilder()
        .withName(fileName)
        .withPath(path)
        .withMimeType(mimeType)
      const testImage = await umbracoApi.media.saveFile(mediaItem, mediaFile);
      // Finds the image path so we are able to locate where the image is located in the wwwroot
      const imagePath = testImage.mediaLink.replace('/media/', '').replace('/umbraco.png', '');

      const element = await createDefaultBlockGridWithElement(umbracoApi);

      await umbracoUi.navigateToDataType(blockGridName);

      // Adds a thumbnail color for the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await page.locator('[key="blockEditor_addThumbnail"]').click();
      await page.locator('[data-element="tree-item-wwwroot"]').locator('[data-element="tree-item-expand"]').click();
      await page.locator('[data-element="tree-item-media"]').locator('[data-element="tree-item-expand"]').click();
      await page.locator('[data-element="tree-item-' + imagePath + '"]').locator('[data-element="tree-item-expand"]').click();
      await page.locator('.umb-tree-item__label', {hasText: fileName}).click();
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submitChanges));
      await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));

      // Assert
      await umbracoUi.isSuccessNotificationVisible();
      // Checks if the thumbnail was added to the block
      await page.locator('[data-content-element-type-key="' + element['key'] + '"]').click();
      await umbracoUi.clickDataElementByElementName('sub-view-advance');
      await expect(page.locator('.umb-el-wrap', {has: page.locator('[key="blockEditor_thumbnail"]')})).toContainText('umbraco.png');

      // Clean
      await umbracoApi.media.ensureNameNotExists(imageName);
    });
  });
});