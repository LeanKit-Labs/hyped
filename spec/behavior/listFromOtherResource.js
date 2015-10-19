module.exports = {
	_origin: { href: "/parent/1/child?page=1&size=5", method: "GET" },
	_resource: "parent",
	_action: "children",
	children: [
		{
			id: 1,
			parentId: 1,
			title: "one",
			description: "the first item",
			_resource: "child",
			_action: "self",
			_origin: { href: "/parent/1/child/1", method: "GET" },
			_links: {
				self: { href: "/parent/1/child/1", method: "GET" },
				change: { href: "/parent/1/child/1", method: "PUT" }
			}
		},
		{
			id: 2,
			parentId: 1,
			title: "two",
			description: "the second item",
			_resource: "child",
			_action: "self",
			_origin: { href: "/parent/1/child/2", method: "GET" },
			_links: {
				self: { href: "/parent/1/child/2", method: "GET" }
			}
		},
		{
			id: 3,
			parentId: 1,
			title: "three",
			description: "the third item",
			_resource: "child",
			_action: "self",
			_origin: { href: "/parent/1/child/3", method: "GET" },
			_links: {
				self: { href: "/parent/1/child/3", method: "GET" },
				change: { href: "/parent/1/child/3", method: "PUT" }
			}
		}
	],
	_links: {
		self: { href: "/parent/1", method: "GET" },
		children: { href: "/parent/1/child", method: "GET",
			parameters: {
				size: { range: [ 1, 100 ] }
			}
		},
		"next-child-page": {
			href: "/parent/1/child?page=2&size=5",
			method: "GET",
			parameters: {
				size: { range: [ 1, 100 ] }
			}
		}
	}
};
