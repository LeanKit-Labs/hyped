## 0.5.x

### Next
* Send 204 (or other empty responses) without HAL wrapper
* Skip extra HAL links, authorization work when returning JSON responses
* Don't call authorize a second time for the link currently being rendered

### 0.5.1
 * Bug fix - hypermedia links no longer returned in error responses (status > 400)

### 0.5.0
 * Bug fix - jsonEngine was turning strings in arrays into objects
 * Refactor url generation to include resource url and api prefixes (instead of replacing them)

## 0.4.x

### 0.4.4

* Fixed issue where OPTIONS call was cached in memory on first request and cached result was used from then on.

### 0.4.3
 * Bug fix - jsonEngine was turning strings in arrays into objects
 * Bug fix - An undefined response was causing errors

### 0.4.2
 * Don't evaluate authorize on hidden actions
 * Add method to envelope
 * Improvement - lists should include link hypermedia at the top level
 * Improvement - lists should allow additional metadata in response
 * Bug fix - don't call authorize multiple times per action link when generating a response
 * Bug fix - action links weren't rendered in hypermedia
 * Bug fix - action and resource were missing from lists
 * Bug fix - jsonEngine wasn't remove hypermedia keys from list results

### 0.4.1
Fix defect where envelope was not passed to authorize during options call.

### 0.4.0
 * Allow authorize to return a promise
 * Add `hidden` feature to exclude actions from OPTIONS hyperlinks
 * Add `actions` property to control which actions are included in hyperlinks
 * Fill out URL parameters in action links from incoming request data
 * Refactor hyperResource into multiple modules
 * Rework tests to reflect new module separation

### 0.3.1
 * Breaking API changes to support authorize predicate in determining link visibility automatically
 * Broader use of envelope abstraction throughout library to improve availability of request across features

## 0.2.x

### 0.2.5
 * Bug fix - defect in hyperResponse resulting in undefined context for conditional predicate on actions
 * Add better top level describes to each spec module
 * Add autohost integration test to ensure context is present in handle

### 0.2.4
Bug fix - resources with custom urlPrefixes did not get hypermedia middleware

### 0.2.3

> Note: API change is non-breaking as original call format still works - older version is no longer documented in README.

 * Bug fix - hyped should include route level url and api prefix settings
 * Improvement - allow specification of default content-type if accept header is "*/*"
 * Changed content-type for errors to "text/plain"

### 0.2.2
 * Improvement - support empty or undefined apiPrefix
 * Bug fix - on apiPrefix of '/', '', or undefined, do not produce routes with empty segments

### 0.2.1
 * Bug fix - status code was not being set correctly using new object literal syntax.
 * Add support back for original render approach.

### 0.2.0
 * Requires autohost 0.4.0
 * Support for new return-style handlers
 * Add support for headers and cookies
 * Update dependencies
 * Use biggulp for tests
 * Re-org spec folder
 * Clean up integration tests

## 0.1.x

### 0.1.0
Auto-prefix resource URLs if resource name is missing (parity with Autohost's URL strategy).

### prerelease 6
Fixed case on hyperResource and hyperResponse requires in index.js.

### prerelease 5
Add `_resource` and `_action` fields to resources so that consumers can determine "friendly" names by which each resource was produced.

### prerelease 4
Bug fix - acions with conditions should always render during options.

### prerelease 3
Pass context to the auth check call (new feature available in autohost auth providers for contextual authorization).

### prerelease 2
Add support for a urlPrefix at the resource level.

### prerelease 1

 * Refactor of the approach to creating hypermedia.
 * Fix issue #1 - action filter for embedded resources now work correctly
 * Support the ability to filter out child actions from OPTIONS
 * Change override to render/action to be statically specified by a `render` property on the action
 * Bug fixes/changes to how path variables are treated
 * Elimination of redundant tests

## 0.0.*

### 0.0.12
Add support for query parameter definition.

### 0.0.11

 * Support the ability to include additional links per action
 * Allow the render to specify the origin instead of calculating it
 * Bug fix - missing embedded properties should not cause the world to end

### 0.0.10
Handle an edge case where rendering can fail due to defaulting the response body to undefined.

### 0.0.9

 * Change options response to be more in-line/consistent with HAL
 * Return `braced` path variables to clients and `:` prefixed path variables for server-side routing

### 0.0.8
Refactor how hyperModel works in order to support the ability to render a collection of related resources from another resource's action.

### 0.0.7
Fix edge case causing origins and links rendered for a nested resource not to have the correct prefix or parentUrl.

### 0.0.6
Fix a bug in determining when a templated link exists in a link href.

### 0.0.5
Embedded properties are no longer included in the response model by default. The only way to get a property on the model that was listed under the `embed` section is to also list the property in an `include` property.

### 0.0.4
Focused entirely on allowing hyped to control URL generation for autohost - see [autohost's changelog](https://github.com/arobson/autohost/blob/master/CHANGELOG.md#prerelease-3) for reference. This approach was required in order to avoid pulling a great deal of hyped's URL creation approach while still allowing valid express routes to be created when dealing with parent/child resources.

### 0.0.3
Change fluent call for setting the status code from `code` to `status` to better align with other libraries (and be easier to "guess correctly").

### 0.0.2
Changed envelope/request method from `hyper` to `hyped` to match library name.

### 0.0.1
Initial check-in
