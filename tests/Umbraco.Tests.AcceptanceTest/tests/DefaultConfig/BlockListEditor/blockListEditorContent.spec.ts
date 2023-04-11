import {AliasHelper, ConstantHelper, test} from '@umbraco/playwright-testhelpers';
import {expect} from "@playwright/test";
import {ContentBuilder, DocumentTypeBuilder, PartialViewBuilder} from "@umbraco/json-models-builders";
import {BlockListDataTypeBuilder} from "@umbraco/json-models-builders/dist/lib/builders/dataTypes";

test.describe('BlockListEditorContent', () => {

  const documentName = 'DocumentTestName';
  const blockListName = 'BlockListTest';
  const elementName = 'TestElement';

  const documentAlias = AliasHelper.toAlias(documentName);
  const blockListAlias = AliasHelper.toAlias(blockListName);
  // Won't work if I use the to alias for the elementAlias
  const elementAlias = 'testElement';
  
  test.beforeEach(async ({page, umbracoApi, umbracoUi}, testInfo) => {
    await umbracoApi.report.report(testInfo);
    await umbracoApi.login();
    await umbracoApi.documentTypes.ensureNameNotExists(documentName);
    await umbracoApi.documentTypes.ensureNameNotExists(elementName);
    await umbracoApi.dataTypes.ensureNameNotExists(blockListName);
  });
  
  test.afterEach(async ({page, umbracoApi, umbracoUi}) => {
    await umbracoApi.documentTypes.ensureNameNotExists(documentName);
    await umbracoApi.documentTypes.ensureNameNotExists(elementName);
    await umbracoApi.dataTypes.ensureNameNotExists(blockListName);
  });

  async function createDefaultBlockList(umbracoApi, blockListName, element){
    const dataTypeBlockList = new BlockListDataTypeBuilder()
      .withName(blockListName)
      .addBlock()
      .withContentElementTypeKey(element['key'])
      .withSettingsElementTypeKey(element['key'])
      .done()
      .build();
    return await umbracoApi.dataTypes.save(dataTypeBlockList);
  }
  
  async function createDocumentWithOneBlockListEditor(umbracoApi, element, dataType){
    
    if(element == null) {
      element = await umbracoApi.documentTypes.createDefaultElementType(elementName, elementAlias);
    }
    
    if(dataType == null) {
      dataType = await createDefaultBlockList(umbracoApi, blockListName, element);
    }
    
    const docType = new DocumentTypeBuilder()
      .withName(documentName)
      .withAlias(documentAlias)
      .withAllowAsRoot(true)
      .addGroup()
        .withName('BlockListGroup')
        .addCustomProperty(dataType['id'])
          .withLabel('BlockGroup')
          .withAlias(blockListAlias)
        .done()
      .done()
      .build();
    await umbracoApi.documentTypes.save(docType);
    
    return element;
  }
  
  async function createContentWithOneBlockListEditor(umbracoApi, element) {
    
    if(element == null) {
      element = await createDocumentWithOneBlockListEditor(umbracoApi, null, null);
    }
    
    const rootContentNode = new ContentBuilder()
      .withContentTypeAlias(documentAlias)
      .withAction(ConstantHelper.actions.save)
      .addVariant()
        .withName(blockListName)
        .withSave(true)
        .addProperty()
          .withAlias(blockListAlias)
          .addBlockListValue()
            .addBlockListEntry()
              .withContentTypeKey(element['key'])
              .appendContentProperties(element.groups[0].properties[0].alias, "aliasTest")
            .done()
          .done()
        .done()
      .done()
      .build();
    await umbracoApi.content.save(rootContentNode);
    
    return element;
  }

  test('can create content with a block list editor', async ({page, umbracoApi, umbracoUi}) => {
    await createDocumentWithOneBlockListEditor(umbracoApi, null, null);
    
    const rootContentNode = new ContentBuilder()
      .withContentTypeAlias(documentAlias)
      .withAction(ConstantHelper.actions.save)
      .addVariant()
        .withName(blockListName)
        .withSave(true)
      .done()
      .build();
    await umbracoApi.content.save(rootContentNode);

    await umbracoUi.goToSection(ConstantHelper.sections.content);
    await umbracoUi.refreshContentTree();

    // Opens the content with the block list editor
    await umbracoUi.clickDataElementByElementName('tree-item-' + blockListName);

    // Adds TestElement
    await page.locator('[key="blockEditor_addThis"]', {hasText: elementName}).click();
    await page.locator('[id="sub-view-0"]').locator('[id="title"]').fill('Testing...');
    await page.locator('[label="Create"]').click();

    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.saveAndPublish));

    // Assert
    await umbracoUi.isSuccessNotificationVisible();
    
    // Checks if the content was created
    await expect(page.locator('.umb-block-list__block--view')).toHaveCount(1);
    await expect(page.locator('.umb-block-list__block--view').nth(0)).toHaveText(elementName);
  });
});