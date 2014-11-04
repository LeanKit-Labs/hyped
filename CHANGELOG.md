## 0.0.6
Fix a bug in determining when a templated link exists in a link href.

## 0.0.5
Embedded properties are no longer included in the response model by default. The only way to get a property on the model that was listed under the `embed` section is to also list the property in an `include` property.

## 0.0.4
Focused entirely on allowing hyped to control URL generation for autohost - see [autohost's changelog](https://github.com/arobson/autohost/blob/master/CHANGELOG.md#prerelease-3) for reference. This approach was required in order to avoid pulling a great deal of hyped's URL creation approach while still allowing valid express routes to be created when dealing with parent/child resources.

## 0.0.3
Change fluent call for setting the status code from `code` to `status` to better align with other libraries (and be easier to "guess correctly").

## 0.0.2
Changed envelope/request method from `hyper` to `hyped` to match library name.

## 0.0.1
Initial check-in