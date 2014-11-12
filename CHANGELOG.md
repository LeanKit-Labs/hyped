## 0.1.0

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