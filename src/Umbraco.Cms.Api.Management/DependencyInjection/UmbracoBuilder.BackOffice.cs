using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Hosting;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Infrastructure.DependencyInjection;
using Umbraco.Cms.Web.Common.Hosting;

namespace Umbraco.Extensions;

/// <summary>
/// Extension methods for <see cref="IUmbracoBuilder"/> for the Umbraco back office
/// </summary>
public static partial class UmbracoBuilderExtensions
{
    /// <summary>
    /// Adds all required components to run the Umbraco back office
    /// </summary>
    public static IUmbracoBuilder
        AddBackOffice(this IUmbracoBuilder builder, Action<IMvcBuilder>? configureMvc = null) => builder
        .AddConfiguration()
        .AddUmbracoCore()
        .AddWebComponents()
        .AddHelpers()
        .AddBackOfficeCore()
        .AddBackOfficeIdentity()
        .AddBackOfficeAuthentication()
        .AddTokenRevocation()
        .AddMembersIdentity()
        .AddUmbracoProfiler()
        .AddMvcAndRazor(configureMvc)
        .AddBackgroundJobs()
        .AddUmbracoHybridCache()
        .AddDistributedCache()
        .AddCoreNotifications();

    /// <summary>
    /// Registers the essential services required for the Umbraco back office, including the back office path generator and the physical file system implementation.
    /// </summary>
    /// <param name="builder">The <see cref="IUmbracoBuilder"/> to add services to.</param>
    /// <returns>The updated <see cref="IUmbracoBuilder"/> instance.</returns>
    public static IUmbracoBuilder AddBackOfficeCore(this IUmbracoBuilder builder)
    {
        builder.Services.AddUnique<IBackOfficePathGenerator, UmbracoBackOfficePathGenerator>();
        builder.Services.AddUnique<IPhysicalFileSystem>(factory =>
        {
            var path = "~/";
            IHostingEnvironment hostingEnvironment = factory.GetRequiredService<IHostingEnvironment>();
            return new PhysicalFileSystem(
                factory.GetRequiredService<IIOHelper>(),
                hostingEnvironment,
                factory.GetRequiredService<ILogger<PhysicalFileSystem>>(),
                hostingEnvironment.MapPathContentRoot(path),
                hostingEnvironment.ToAbsolute(path));
        });

        return builder;
    }
}
