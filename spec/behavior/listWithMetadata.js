module.exports = {
	_origin: { href: "/parent", method: "GET" },
	_resource: "parent",
	_action: "list",
	total: 2,
	description: "no need to argue, parents just don't understand",
	parents: [
		{
			id: 1,
			title: "one",
			children: [ {} ],
			description: "the first item",
			_origin: { href: "/parent/1", method: "GET" },
			_resource: "parent",
			_action: "self",
			_links: {
				self: { href: "/parent/1", method: "GET" },
				children: { href: "/parent/1/child", method: "GET",
					parameters: {
						size: { range: [ 1, 100 ] }
					}
				},
				"child:create": { href: "/parent/1/child", method: "POST" }
			}
		},
		{
			id: 2,
			title: "two",
			children: [ {} ],
			description: "the second item",
			_origin: { href: "/parent/2", method: "GET" },
			_resource: "parent",
			_action: "self",
			_links: {
				self: { href: "/parent/2", method: "GET" },
				children: { href: "/parent/2/child", method: "GET",
					parameters: {
						size: { range: [ 1, 100 ] }
					}
				},
				"child:create": { href: "/parent/2/child", method: "POST" }
			}
		}
	],
	_links: {
		list: {
			href: "/parent", method: "GET"
		}
	}
};
