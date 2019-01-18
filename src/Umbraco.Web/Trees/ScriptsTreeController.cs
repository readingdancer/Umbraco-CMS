﻿using Umbraco.Core;
using Umbraco.Core.IO;
using Umbraco.Web.Composing;
using Umbraco.Web.Models.Trees;

namespace Umbraco.Web.Trees
{
    [CoreTree(TreeGroup = Constants.Trees.Groups.Templating)]
    [Tree(Constants.Applications.Settings, Constants.Trees.Scripts, "Scripts", "icon-folder", "icon-folder", sortOrder: 10)]
    public class ScriptsTreeController : FileSystemTreeController
    {
        protected override IFileSystem FileSystem => Current.FileSystems.ScriptsFileSystem; // todo inject

        private static readonly string[] ExtensionsStatic = { "js" };

        protected override string[] Extensions => ExtensionsStatic;

        protected override string FileIcon => "icon-script";
            //TODO: This isn't the best way to ensure a noop process for clicking a node but it works for now.
    }
}
