using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Infrastructure.Examine;
using Umbraco.Cms.Api.Management.Factories;
using Umbraco.Cms.Api.Management.Services;
using Umbraco.Cms.Infrastructure.Services;

namespace Umbraco.Cms.Api.Management.DependencyInjection;

/// <summary>
/// Provides extension methods for configuring search management services.
/// </summary>
public static class SearchManagementBuilderExtensions
{
    internal static IUmbracoBuilder AddSearchManagement(this IUmbracoBuilder builder)
    {
        // Add examine service
        builder.Services.AddTransient<IExamineManagerService, ExamineManagerService>();
        builder.Services.AddTransient<IIndexingRebuilderService, IndexingRebuilderService>();

        // Add factories
        builder.Services.AddTransient<IIndexDiagnosticsFactory, IndexDiagnosticsFactory>();
        builder.Services.AddTransient<IIndexPresentationFactory, IndexPresentationFactory>();

        return builder;
    }
}
