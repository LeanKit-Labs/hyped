## hyped
A simple approach to generating [HAL](http://stateless.co/hal_specification.html)-esque hypermedia responses based on resource definitions. Built to work best with [autohost](https://github.com/leankit-labs/autohost) but should work with most Node.JS HTTP stacks with a little extra effort.

	This is alphaware!

## Concepts
You can skip to the [Using](#Using) section but understanding the concepts behind should explain

### Resource Definition
The resource definition provides the metadata necessary for hyped to generate hypermedia based on the model you provide it. This declaritive approach takes advantage of the structure and property names you provide to make implicit associations. The trade-off is that the associations are made based on consistent naming across several properties and values and __typos will break the expected outcome__.

```
// resource
{
	[resourceName]: the resource name (must be unique)
	parent: (optional) the name of the resource that this "belongs" to.
	actions: {
		[actionName]: {
			method: the http method
			url: the URL for this action
			render: override the resource/action that gets rendered from this action
			include: property names array to include in the rendered response
			exclude: property names array to exclude from rendered response
			filter: predicate to determine if a property's key/value should be included
			condition: returns true if the action is valid for the given model
			transform: a map function that operates against the data
			embed: defines which model properties are embedded resources and how to render them
			links: provides alternate/compatible urls for activating this action
			parameters: provide metadata to describe available query parameters for this action
		}
	},
	versions: {
		#: {
			[actionName]: {
				// provide any of the above properties to change how this
				// version will differ from the previous version
				// these changes are applied cumulatively in descending order
			}
		}
	}
}

// render
// use case: when returning child items from a parent resource's action
{
	resource: the resource that is actually being returned from this action
	action: the action that should be used to render the resource
}

// embed
// use case: when returning a parent object that contains properties that should
// be rendered/treated like nested resources
{
	[propertyName]: {
		resource: name of the embedded resource
		render: which action will be used to render the resource (usually "self")
		actions: an array of the actions that should be included
	}
}

// links
// use case: when an action has a limited set of parameter values that should be
// given a friendly name
{
	[actionName]: url|generator
}

// parameters
// use case: when you want to define the available parameters for an action
// for use by the client
{
	parameterName: {
		[ range|choice|list|validate|invalidate ]: specification
	}
}
```

### Resource Fields
<dl>
	<dt>resourceName</dt>
	<dd>The name of your resource. This will be important to keep unique and easy to remember because the <tt>parent</tt> property of other resources and the <tt>resource</tt> property of an embed section will need to match one of your resource names.</dd>
	<dt>parent</dt>
	<dd>Defines this resource as belonging to another resource. This will cause all of the action URLs in this resource to be prefixed by the parent resource's <tt>self</tt> href.</dd>
	<dt>actionName</dt>
	<dd>The name of the action will determine the name of the link exposed in the resource's links.</dd>
	<dt>method</dt>
	<dd>The HTTP method used to activate this action.</dd>
	<dt>url</dt>
	<dd>The URL segment for this action. If there is no parent resource, this will be the URL for this action. If a parent resource has been specified, the parent's <tt>self</tt> URL will get pre-pended to the URL provided here.</dd>
	<dt>include</dt>
	<dd>A list of properties to include from the raw data model in the response.</dd>
	<dt>exclude</dt>
	<dd>A list of properties to exclude from the raw data model in the response.</dd>
	<dt>filter</dt>
	<dd>A function to determine which data model keys shouldn't be included in the response.</dd>
	<dt>transform</dt>
	<dd>A way to perform a map function against the model to produce the response body.</dd>
	<dt>condition</dt>
	<dd>A predicate used to determine if this action should be included in the link list when rendering a response.</dd>
	<dt><h3>embed</h3></dt>
	<dd>This section defines whether or not other resources can/should be included in the action's response. It effectively allows the server to provide pre-fetched, related resources to the client.</dd>
	<dt>propertyName</dt>
	<dd>The name of the property on the data model that will contain one or more of the embedded resources. This property name will, by default, be removed from the response.</dd>
	<dt>resource</dt>
	<dd>The name of the resource that defines how each item under the data model property should be rendered as a resource.</dd>
	<dt>render</dt>
	<dd>Determines which of the embedded resource's actions should be used to produce its representation as an embedded resource.</dd>
	<dt>actions</dt>
	<dd>A string array listing which links should be provided per embedded resource.</dd>
	<dt><h3>links</h3></dt>
	<dd>A hash of additional actions to include in the links related to this action. These additional links will only be included in a resource's `_links` when the action itself is valid (passes both auth and `condition` checks when provided). Note - you cannot provide a method other than what already exists on the action the links belong to (it wouldn't make sense).

	This feature is to allow action aliases for known sets of query parameters.
	</dd>
	<dt>url</dt>
	<dd>Works the same as the `url` for the action.</dd>
	<dt>generator</dt>
	<dd>A function that takes the data model and a context hash and optionally returns a url string. Returning an empty string or undefined will exclude the link from rendered results. See <a href="#rendering-api">Rendering API</a> for how the context is specified.
	<div class="highlight highlight-javascript">	<pre>
	"next-page": function( data, context ) {
		// results in a url like "/thing?page=1&amp;size=10"
		return "/thing?page=" + ( context.page + 1 ) + "&amp;size=" + context.size;
	}
	</pre>
	</div>
	</dd>
	<dt><h3>parameters</h3></dt>
	<dd>A hash of parameter names and metadata about each parameter. Each parameter should specify what "type" it is along with a specification that the client can use to validate possible parameter values. Any of the specifications can be a generator function to allow for dynamic specification.</dd>
	<dt>choice</dt>
	<dd>An array of valid choices where the consumer is expected to provide a single value.</dd>
	<dt>multi</dt>
	<dd>An array of valid choices where the consumer can provide multiple values.</dd>
	<dt>range</dt>
	<dd>A two-element array consisting of a lower and upper bound for the parameter value.</dd>
	<dt>validate</dt>
	<dd>A regular expression used to determine if a parameter value is valid.</dd>
	<dt>invalidate</dt>
	<dd>A regular expression used to detect invalid parameter values.</dd>
	<dt>required</dt>
	<dd>A boolean indicating that this parameter is required.</dd>
	<dt><h3>render</h3></dt>
	<dd>Use this when the resource and action that should get rendered differs from the
	resource and action currently being rendered.
	</dd>
	<dt>resource</dt>
	<dd>The name of the resource that is being rendered.</dd>
	<dt>action</dt>
	<dd>The name of the action to use in rendering the resource.</dd>
</dl>

#### Example

```javascript
// account resource
{
	name: "account",
	actions: {
		self: {
			method: "get",
			url: "/account/:id",
			include: [ "id", "balance" ],
			embed: {
				transactions: {
					resource: "transaction",
					render: "self",
					actions: [ "self", "detail" ]
				}
			}
		},
		withdraw: {
			method: "POST",
			url: "/account/:id/withdrawal",
			condition: function( account ) {
				return account.balance > 0;
			},
			include: [ "id", "accountId", "amount", "balance", "newBalance" ]
		},
		deposit: {
			method: "POST",
			url: "/account/:id/deposit",
			include: [ "id", "accountId", "amount", "balance", "newBalance" ]
		}
	}
}

//transaction resource
{
	name: "transaction",
	parent: "account",
	actions: {
		self: {
			method: "get",
			url: "/transaction/:transaction.id",
			include: [ "id", "amount", "date" ],
			links: {
				"details": "/transaction/:transaction.id?detail=true"
			}
		}
	}
}
```

### Rendering
hyped generates an abstract hypermedia model based off a resource definition and data model. This hypermedia model is then passed to a "rendering engine" that produces a HTTP response body based on the requested media type.

### Abstract hypermedia model
Understanding the structure of the hypermedia model is important if you'd like to define your own rendering function for custom media types.

__HyperModel Structure__
```javascript
{
	// top level properties starting with a '_' are metadata
	// all other properties are attached based on the resource definition
	_origin: { href: "", method: "" },
	_links: {
		self: { href: "/thing/100", method: "get" },
		child: { href: "/thing/100/child/:childId", method: "get", templated: true }
	},
	_embedded: {
		children: [
			// each embedded resource will follow the same pattern/format
		]
	}
}
```

<dl>
	<dt>_origin</dt>
	<dd>The origin provides the <tt>method</tt> and <tt>href</tt> that you would use to get to the current result. <tt>_origin</tt> is repeated even for embedded resources so that the consumer can tell how they would get to the same representation that was included in the embedded section.</dd>

	<dt>_links</dt>
	<dd>The actions available for the given resource.</dd>
	
	<dt>_embedded</dt>
	<dd>If a key in the <tt>embed</tt> section matches one on the data model provided, the resources contained will show up under the property matching the one on the data model. Each embedded resource will contain <tt>_origin</tt> and <tt>_links</tt> and may also include its own <tt>_embedded</tt> section.</dd>

</dl>

### Rendering engine
Rendering engines are simply functions with the signature `function( hyperModel )`. These functions take the hyperModel and produce the correct response body for their given media type. The built in engine for "application/hal+json" looks like this:

```javascript
function render( model ) { 
	return JSON.stringify( model );
}
```

	Note: the engine for "application/json" is more complex since it has to effectively reduce and filter a more complex data structure to produce simple JSON.


### Content negotiation
The accept header is used to select an appropriate rendering engine (if one is available). If no engine matches the provided media type, hyped will respond to the client request with a 415 explaining that the requested media type is not supported. 

### Versioning
New versions are implemented as diffs that get applied, in order, against the baseline. Each version provides new values for properties that replace parts of the metadata for the resource. This will hopefully make it easy to see the differences between versions of a resource and reduce the amount of copy/pasted code between versions of a resource definition.

### URLs
hyped will attempt to replace path variables specified in two separate styles for two separate use cases:

__Express style variables__
 1. `:property`
 1. `:property.childProperty`

__Brace style variables__
 1. `{property}`
 1. `{property.childProperty}`

Either style is valid when specifying the URL in the action, hyped will make sure that the correct form is used (Express style gets used server side for assigning routes while brace style is returned in all client responses).

The first form will be used to attempt to read a property directly on the model. The second will attempt to read a nested property _or_ a property name that combines the two in camel-case fahsion (i.e. `propertyChildProperty`). In either case, if no match is found, the variable will be left in tact. In the second case, the period is removed and the variable becomes camel-case.

Example:
```javascript
{
	name: "user",
	actions: {
		self: {
			method: "get",
			url: "/user/:user.name"
		}
	}
}
```

If the user model in question had a name property of `"leroyJenkins"`, the response body would look like this:

```javascript
{
	"name": "leroyJenkins",
	"_links": {
		"self": { "href": "/user/leroyJenkins", "method": "GET" }
	}
}
```

When a URL contains path variables that could not be replaced by a value in the model, the action/origin link will indicated this with a `templated` property set to `true`.

	Note: the client will always see brace-style path variables

```javascript
{
	"name": "leroyJenkins",
	"_links": {
		"self": { "href": "/user/leroyJenkins", "method": "GET" },
		"insult": { "href": "/user/leroyJenkins/{insult}", "method": "POST", "templated": true }
	}
}
```

## Usage
These examples show the bare minimum. You'll only get support for built in mediatypes - presently `application/json` and `application/hal+json`. This means if you don't provide your own engine for custom media types and a client sends an accept header for a media type hyped knows about, it will send back a 415 (unsupported media type) to the client rather than throwing an exception.

### With Autohost
This example will add an express middleware to `autohost` that extends the envelope with a fluent set of calls that can be used to construct and render a hypermedia response. The correct version, rendering engine, resource and action are all determined during the hyped middleware you add to autohost so that when rendering a response, the only things you must provide is the model.

	Note: at this time autohost 0.3.0-3 or greater is required

__index.js__
```javascript
var autohost = require( "autohost" );
var hyped = require( "hyped" )();
autohost
	.init( {
		noOptions: true, // turn off autohost's OPTIONS middleware
		urlStrategy: hyped.urlStrategy // use hyped's URL strategy
	} )
	.then( hyped.addResources );
hyped.setupMiddleware( autohost );
```

__resource.js__
```javascript
var databass = require( "myDAL" );
module.exports = {
	name: "something",
	actions: {
		self: {
			method: "get",
			url: "/something/:id",
			exclude: [],
			handle: function( envelope ) {
				var model = databass.getSomethingById( id );
				envelope.hyped( model ).status( 200 ).render();
			}
		}
	},
	versions: {
		2: {
			exlude: [ "weirdFieldWeShouldNotExpose" ]
		}
	}
};
```

### With Express
__express__
```javascript
// assumes you have a hash containing all your resource definitions and express set up
var hyped = require( "hyped" )( resources );
hyped.setupMiddleware( app );

app.get( "something/:id", function( req, res ) {
	var id = req.param( "id" );
	var model = databass.getSomethingById( id );
	req.hyped( model ).status( 200 ).render();
} );
```

## API

If you are using this library with Autohost, the only API you really need to know about is used for the initial setup and the response generation.

## Setup API

### require( "hyped" )( [resourceList], [defaultToNewest], [includeChildrenInOptions] )
You can skip passing resource list at all and provide the two booleans in the order specified.

__defaultToNewest__: causes hyped to default to the newest available version when one isn't specified
__includeChildrenInOptions__: include child resource actions in the OPTIONS response

### addResource( resource, resourceName )
Adds the metadata for a particular resource.

### addResources( resources )
Adds multiple resources at once. Intended to make autohost setup simple.

```javascript
autohost.init( { noOptions: true } )
	.then( hyped.addResources );
```

### registerEngine( mediaType, renderer )
Registers a rendering function with one or more mediaTypes.

```javascript
// this is a ridiculous example. don't do it.
hyped.registerEngine( "text/plain", function( model ) {
	return model.toString();
} );
```

### setupMiddleware( server )
This call can take either a reference to the autohost lib or express's app instance. It will register both the [`hypermediaMiddleware`](#hypermediaMiddleware) and the [`optionsMiddleware`](#optionsMiddleware) with the HTTP library in use.

Refer to the [usage](#usage) examples above to see this call in use.

### versionWith( versionFn )
Changes hyped's default versioning detection approach. This is experimental and not recommended. The `versionFn` is a function that takes the request object and returns a version number.

```javascript
// this isn't great, but if you have to ...
hyped.versionWith( req ) {
	return req.headers[ "x-version" ] || 1;
}
```

## Rendering API
The hypermedia middleware extends autohost's envelope and the underlying request object with a set of fluent calls to help with the construction of a hypermedia response.

Keep in mind that normally, you will only use the `hyped`, `status` and `render` calls. The middleware should correctly detect the version, mediatype, resource and action to be rendered.

```javascript
	// within an autohost handler
	envelope.hyped( myData ).status( 200 ).render();
	
	// within an express route
	req.hyped( myData ).status( 200 ).render();
```

### .hyped( model, [context] )
You provide the data model that the resource will render a response based on. The resources are designed to work with models that may have a great deal more information than should ever be exposed to the client.

### .context( context )
Another way to provide context to any link generators for this action.

### .status( statusCode )
If omitted, this is always 200. Be good to your API's consumers and use proper status codes.

### .render()
Returns the response to the client.

## Departures/Extensions To HAL
I think HAL is pretty awesome. We"ve added a few minor extensions and may continue. This is where we"ll describe them.

### Options
`_versions` and `_mediatypes` properties have been added to the payload returned from the OPTIONS call to the API root. They will list the available versions and mediatypes currently supported by the server.

__OPTIONS response structure__
```javascript
{
	"_links": {
		"resource:action": { href: "", method: "", templated: true }
	}
}
```

All actions will be returned under the top-level `_links` property. The action names returned from OPTIONS will be namespaced by the resource name delimited by a colon.

### Origin
Provides a data structure identical to the link that would be called to produce the response. This is especially useful within embedded resources as it allows the client to see what link action was used to produce the embedded resource included in the payload.

We added this to make it easier for clients to know which representation they have in memory for the sake of both local caching and requesting updated versions. We recommend including etag or last-modified data along with resources to further improve efficiency.

### Links

#### Methods
HAL does not include the HTTP method used for an link"s `href`. Our version does include this information in the link using the `method` property. As in our URL example from above:

```javascript
{
	"name": "leroyJenkins",
	"_links": {
		"self": { "href": "/user/leroyJenkins", "method": "GET" }
	}
}
```

#### Parameters
While the `links` property allows you to provide actions with the parameters already attached to the URL, there will be times when defining every possible combination of parameters as a specific action won't make sense.

In those cases, we believe hypermedia should include metadata about the available parameters. This at least reduces the amount of implementation details exposed to API consumers.

```javascript
{
	"_links": {
		"self": { 
			"href": "/thing/100",
			"method": "GET", 
			"parameters": {
				"arg1": {
					"range": [ 0, 100 ]
				},
				"arg2": {
					"choice": [ 4, 8, 15, 16, 23, 42 ]
				},
				"arg3": {
					"multi": [ "a", "b", "c", "d" ]
				},
				"arg4": {
					"validate": "/^starts with.*/",
					"invalidate": "/.*ends with$"
				}
			}
		}
	}
}
```

## Contributing
The tests are a bit of a contrived mess at the moment but do exercise the features and known use cases. If submitting a PR, please do the following:

 * Branch for the feature/fix
 * Make any changes to the README required to reflect changes
 * Create/modify tests


## Roadmap
None of this is guaranteed but here are some items that would be nice/great to have.

 * Add ability to define data contracts for request/response bodies per resource and action
 * Filter options response based on authorization method
 * Support for websockets