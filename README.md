## hyped
A simple approach to generating [HAL](http://stateless.co/hal_specification.html)-esque hypermedia responses based on resource definitions. Built to work best with [autohost](https://github.com/leankit-labs/autohost) but should work with most Node.JS HTTP stacks with a little extra effort.

	This is alphaware!

## Concepts
You can skip to the [Using](#Using) section but understanding the concepts behind should explain

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
hyped will attempt to replace path variables following two formats:

 1. `:property`
 1. `:property.childProperty`

The fist form will be used to attempt to read a property directly on the model. The second will attempt to read a nested property. In either case, if no match is found, the variable will be left in tact. In the second case, the period is removed and the variable becomes camel-case.

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

```javascript
{
	"name": "leroyJenkins",
	"_links": {
		"self": { "href": "/user/leroyJenkins", "verb": "GET" },
		"insult": { "href": "/user/leroyJenkins/:insult", "verb": "POST", "templated": true }
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
	req.hyped( model ).resource( "something" ).action( "self" ).status( 200 ).render();
} );
```

### Resource Definition

	Note: include and exclude are mutually exclusive

```
{
	name: the resource name (must be unique)
	[inherit]: indicate if this resource should inherit a parent url
	actions: {
		alias: {
			method: the http verb/method
			url: the URL for this action
			include: property names array to include in the rendered response
			exclude: property names array to exclude from rendered response
			filter: predicate to determine if a property's key/value should be included
			condition: returns true if the action is valid for the given model
			embed: defines which model properties are embedded resources and how to render them
		}
	},
	versions: {
		#: {
			actionAlias: {
				// any properties valid 
			}
		}
	}
}

// an embed section looks like this:
{
	propertyName: {
		resource: name of the embedded resource
		render: which action will be used to render the resource (usually "self")
		actions: an array of the actions that should be included
	}
}
```

#### Example

```javascript
// account resource
{
	name: "account",
	actions: {
		self: {
			method: "get",
			url: "/account/:id",
			include: [ "id", "balance" ]
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
	actions: {
		self: {
			method: "get",
			url: "/account/:account.id/transaction/:id",
			include: [ "id", "amount", "date" ]
		},
		detail: {
			method: "get",
			url: "/account/:account.id/transaction/:id?detailed=true",
			include: [ "id", "amount", "date", "location", "method" ]
		}
	}
}
```

## API

If you are using this library with Autohost, the only API you really need to know about is used for the initial setup and the response generation.

## Setup API

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

### .hyped( model )
You provide the data model that the resource will render a response based on. The resources are designed to work with models that may have a great deal more information than should ever be exposed to the client.

### .resource( resourceName )
For use in rare occasions when the resource that needs to be rendered is not the one the action is contained within.

### .action( actionName )
For use in rare occasions when the action you want rendered is not the one being activated.

### .status( statusCode )
If omitted, this is always 200. Be good to your API's consumers and use proper status codes.

### .render()
Returns the response to the client.

## Departures/Extensions To HAL
I think HAL is pretty awesome. We"ve added a few minor extensions and may continue. This is where we"ll describe them.

### Options
`_versions` and `_mediatypes` properties have been added to the payload returned from the OPTIONS call to the API root. They will list the available versions and mediatypes currently supported by the server.

### Origin
Provides a data structure identical to the link that would be called to produce the response. This is especially useful within embedded resources as it allows the client to see what link action was used to produce the embedded resource included in the payload.

We added this to make it easier for clients to know which representation they have in memory for the sake of both local caching and requesting updated versions. We recommend including etag or last-modified data along with resources to further improve efficiency.

### Links

#### Methods
HAL does not include the HTTP verb/method used for an link"s `href`. Our version does include this information in the link using the `verb` property. As in our URL example from above:

```javascript
{
	"name": "leroyJenkins",
	"_links": {
		"self": { "href": "/user/leroyJenkins", "verb": "GET" }
	}
}
```

## Contributing
The tests are a bit of a contrived mess at the moment but do excercise the features. If submitting a PR, please be sure to include tests to cover any new feature or changes as well as making sure no existing tests have broken.

## Roadmap
None of this is guaranteed but here are some items that would be nice/great to have.

 * Add extension to hypermedia for describing query parameters
 * Add ability to define data contracts for request/response bodies per resource and action
 * Filter options response based on authorization method
 * Support for websockets