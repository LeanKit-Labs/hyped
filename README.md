## hyped
A simple approach to generating [HAL](http://stateless.co/hal_specification.html)-esque hypermedia responses based on resource definitions. Built to work best with [autohost](https://github.com/leankit-labs/autohost) but should work with most Node.JS HTTP stacks with a little extra effort.

## Concepts
You can skip to the [Using](#Using) section but understanding the concepts behind should explain

### Resource Definition
The resource definition provides the metadata necessary for hyped to generate hypermedia based on the model you provide it. This declaritive approach takes advantage of the structure and property names you provide to make implicit associations. The trade-off is that the associations are made based on consistent naming across several properties and values and __typos will break the expected outcome__.

```
// resource
{
	[resourceName]: the resource name (must be unique)
	parent: (optional) the name of the resource that this "belongs" to
	urlPrefix: (optional) a resource-level URL prefix for all actions in this resource
	apiPrefix: (optional) an api-level URL prefix for all actions in this resource
	resourcePrefix: (optional) defaults to true - guarantees URLs begin with resource name
	actions: {
		[actionName]: {
			method: the http method
			url: the URL for this action
			authorize: a predicate to determine user access
			render: override the resource/action that gets rendered from this action
			include: property names array to include in the rendered response
			exclude: property names array to exclude from rendered response
			filter: predicate to determine if a property's key/value should be included
			condition: returns true if the action is valid for the given model
			transform: a map function that operates against the data
			embed: defines which model properties are embedded resources and how to render them
			links: provides alternate/compatible urls for activating this action
			parameters: provide metadata to describe available query parameters for this action
			hidden: a boolean indicating that this action should not be included in options
			actions: allows control of which actions are shown in the hypermedia
		}
	},
	hoist: {
		[childResourceName]: [ ] // list of child actions to hoist to this resource's default hypermedia
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
	<dt>urlPrefix</dt>
	<dd>Provide a common URL prefix for all actions in this resource. This appears _after_ the server level urlPrefix and before either the server or resource apiPrefixes.</dd>
	<dt>apiPrefix</dt>
	<dd>Provide a common API prefix for all actions in this resource. This appears at the end of all prefixes right before the urlPath.</dd>
	<dt>actionName</dt>
	<dd>The name of the action will determine the name of the link exposed in the resource's links.</dd>
	<dt>method</dt>
	<dd>The HTTP method used to activate this action.</dd>
	<dt>url</dt>
	<dd>The URL segment for this action. If there is no parent resource, this will be the URL for this action. If a parent resource has been specified, the parent's <tt>self</tt> URL will get pre-pended to the URL provided here.</dd>
	<dt>authorize</dt>
	<dd>A predicate that determines whether the requesting user can perform the action. The predicate takes `envelope` and either the response model _or_ the request's context. The second argument should always provide any data necessary to determine the user's permissions.</dd>
	<dt>include</dt>
	<dd>A list of properties to include from the raw data model in the response.</dd>
	<dt>exclude</dt>
	<dd>A list of properties to exclude from the raw data model in the response.</dd>
	<dt>filter</dt>
	<dd>A function to determine which data model keys shouldn't be included in the response.</dd>
	<dt>transform</dt>
	<dd>A way to perform a map function against the model to produce the response body.</dd>
	<dt>condition</dt>
	<dd>A predicate used to determine if this action should be included in the link list when rendering a response. The arguments passed are the incoming request envelope and the `data` property of the response. These two values should give you access to any information necessary to make the determination.</dd>
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
	"next-page": function( envelope, data ) {
		// the envelope includes all incoming request information
		// including query parameters which get merged onto the data property
		var size = envelope.data.size;
		var page = envelope.data.page;
		if( page &amp;&amp; size ) {
			// results in a url like "/thing?page=1&amp;size=10"
			return "/thing?page=" + ( page + 1 ) + "&amp;size=" + size;
		}
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
	<dt><h3>hidden</h3></dt>
	<dd>Setting this property to true will exclude this action from hyperlinks when rendering options.</dd>
	<dt><h3>actions</h3></dt>
	<dd>Allows control of which actions appear as hyperlinks when rendering this action. When including a hoisted action, the child resource name should appear before the action name seperated by a colon. Ex. `"child:action"`.</dd>
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
			condition: function( envelope, account ) {
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
	_resource: "thing",
	_action: "self",
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

	Note: the engine for "application/json" is more complex since it has to effectively reduce and filter the hypermedia data structure to produce simple JSON.


### Content negotiation
The accept header is used to select an appropriate rendering engine (if one is available). If no engine matches the provided media type, hyped will respond to the client request with a 415 explaining that the requested media type is not supported.

The default mediaTypes supported are:

 * `application/json`
 * `application/hal+json`

### Versioning
New versions are implemented as diffs that get applied, in order, against the baseline. Each version provides new values for properties that replace parts of the metadata for the resource. This will hopefully make it easy to see the differences between versions of a resource and reduce the amount of copy/pasted code between versions of a resource definition.

The default versioning strategy parses the version specifier out of the mediaType in the Accept header:

 * `application/json.v2`
 * `application/hal.v3+json`

### URLs
hyped will attempt to replace path variables specified in two separate styles for two separate use cases:

__Express style variables__
 1. `:property`
 1. `:property.childProperty`

__Brace style variables__
 1. `{property}`
 1. `{property.childProperty}`

Either style is valid when specifying the URL in the action, hyped will make sure that the correct form is used (Express style gets used server side for assigning routes while brace style is returned in all client responses).

The first form will be used to attempt to read a property directly from the returned model or incoming request. The second will attempt to read a nested property _or_ a property name that combines the two in camel-case fahsion (i.e. `propertyChildProperty`). In either case, if no match is found, the variable will be left in tact. In the second case, the period is removed and the variable becomes camel-case.

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

If the user model returned or envelope.data had a name property of `"leroyJenkins"`, the response body would look like this:

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
These examples show the bare minimum. You'll only get support for built in mediatypes - presently `application/json` and `application/hal+json`. This means if you don't provide your own engine for custom media types and a client sends an accept header for a media type hyped doesn't have an engine for, it will send back a 415 (unsupported media type) to the client rather than throwing an exception.

### With Autohost
This example will add middleware to `autohost` that extends the envelope to integrate hyped's rendering. The correct version, rendering engine, resource and action are all determined during the hyped middleware you add to autohost so that when rendering a response, the only thing you must provide is the model.

	Note: this approach only works with Autohost 0.4.0 or greater.

__index.js__
```javascript
var autohost = require( "autohost" );
var hyped = require( "hyped" )();
var host = hyped.createHost( autohost, {
		// regular autohost configuration goes here
	},
	function() {
		// callback gets invoked once all resources are loaded
		// this is where you should call start on the host variable
		host.start();
	} );
```

__resource.js__
```javascript
var databass = require( "myDAL" );
module.exports = function( host ) {
	return {
		name: "something",
		actions: {
			self: {
				method: "get",
				url: "/something/:id",
				exclude: [],
				handle: function( envelope ) {
					var model = databass.getSomethingById( id );
					return {
						status: 200, // default
						data: model
					};
				}
			}
		},
		versions: {
			2: {
				self:
					exclude: [ "weirdFieldWeShouldNotExpose" ]
				}
			}
		}
	};
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

If you are using this library with Autohost, the only API you really need to know about is used for the initial setup. The format of the object literal returned from the handlers is also explained below.

## Setup API

### require( "hyped" )( [resourceList], [config] )
You can skip passing resource list at all and provide the optional configuration to change default behavior.

The configuration hash can have the following properties:

 * __defaultContentType__: which rendering engine to use if the client passes "*/*" in the accept header
 * __defaultToNewest__: causes hyped to default to the newest available version when one isn't specified
 * __includeChildrenInOptions__: include child resource actions in the OPTIONS response

Here's an example of the config block with defaults shown:

```json
{
	"defaultContentType": "application/json",
	"defaultToNewest": false,
	"includeChildrenInOptions": false
}
```

> Note: the defaults in place were selected so that consumers unaware of hypermedia or your APIs versioning strategy can use your API like any other HTTP API they have likely encountered.

### addResource( resource, resourceName )
Adds the metadata for a particular resource.

### addResources( resources )
Adds multiple resources at once. Intended for internal use.

### createHost( autohostLib, autohostConfiguration, [callback] )
Creates an autohost instance with the configuration provided and returns it. The `callback` is invoked once all resources have been processed.

> Note: the callback is most likely only needed during integration testing

```javascript
var autohost = require( "autohost" );
var hyped = require( "hyped" )();
var host = hyped.createHost( autohost, {
		// regular autohost configuration goes here
	} );
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

> Note: this call should only be used with express. Use the new `createHost` call to setup autohost.

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

>> Note: the rendering API is deprecated for use with autohost - see [response format](#response-format) for details.

The hypermedia middleware extends the underlying request object with a set of fluent calls to help with the construction of a hypermedia response. The response object can then be used to send a response via express.

Keep in mind that normally, you will only use the `hyped`, `status` and `render` calls. The middleware should correctly detect the version, mediatype, resource and action to be rendered.

```javascript
	// an approach to rendering the resulting response
	function respond( res, response ) {
		var code = response.status || 200;
		if ( response.headers ) {
			_.each( response.headers, function( v, k ) {
				res.set( k, v );
			} );
		}
		if ( response.cookies ) {
			_.each( response.cookies, function( v, k ) {
				res.cookie( k, v.value, v.options );
			} );
		}
		res.status( code ).send( response.data );
	}

	...

	// from within an express route
	var response = req.hyped( myData ).status( 200 ).render();
	respond( res, response );

```

### .hyped( model, [context] )
You provide the data model that the resource will render a response based on. The resources are designed to work with models that may have a great deal more information than should ever be exposed to the client.

### .context( context )
Another way to provide context to any link generators for this action.

### cookies( cookies )
Sets cookies on the response generated.

### headers( headers )
Sets headers on the response generated.

### .status( statusCode )
If omitted, this is always 200. Be good to your API's consumers and use proper status codes.

### .render()
Returns the response object literal.

## Response Format
The response literal has the following structure:

```javascript
{
	status: 200, // default
	data: , // the data to pass to the rendering engine
	headers: {}, // defaults to content-type header only
	cookies: {}, // defaults to empty
	resource: , // defaults to the resource that received the request
	action: , // defaults to the action that received the request
}
```
### Controlling the top-level result
The `resource` and `action` properties of the _response_ returned from your action handle control what resource and action metdata will be used when rendering the top-level response.

### Rendering Lists
If the `data` property contains an array, the rendering engine will assume that you are returning a list of the resource that owns the list action and use the `"self"` action to determine how to render each item.

To change the resource or action that is used to render the items in the list, you can use the `render` property on the action and provide `resource` and/or `action` properties which will change what resource and action metadata are being used to render each item in the list.

The property on the response containing the rendered items will be the pluralized form of the resource used to render each item. To control this yourself, you can provide a `_alias` property on data.

### Rendering Lists With Metadata
If the `data` property is an object with a `_list` property containing an array, then the array will be rendered as before but with the additional properties from data included as part of the body.

### With Autohost
In an autohost handler, this literal will be processed by hyped first. The data property will be replaced by the output of the appropriate rendering engine. If only the data is returned from the handler, then that will be used to generate the data property of the literal with defaults used for all other properties.

### With Express
This literal format is what an express handle can expect to get back from the `render` call.

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

```javascript
{
	"id": 1,
	"_origin": { "href": "/item/1", "method": "GET" }
	...
}
```

### Resource and Action
We also expose the resource and action name as part of each resource (including embedded resources).

```javascript
{
	"id": 1,
	"_origin": { "href": "/item/1", "method": "GET" }
	"_resource": "item",
	"_action": "self"
}
```

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
