using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Extensions;

namespace Umbraco.Cms.Api.Management;

/// <summary>
/// Responsible for composing and configuring the components required for the Management API in Umbraco CMS.
/// </summary>
public class ManagementApiComposer : IComposer
{
    /// <summary>
    /// Composes the management API services into the Umbraco builder.
    /// </summary>
    /// <param name="builder">The Umbraco builder to add services to.</param>
    public void Compose(IUmbracoBuilder builder) =>
        builder.AddUmbracoManagementApi();
}

