const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');
import { spy, SinonSpy } from 'sinon';

import { v, w, create, getRegistry } from '../../../src/core/vdom';
import { Registry } from '../../../src/core/Registry';
import { Link } from '../../../src/routing/Link';
import { Router } from '../../../src/routing/Router';
import { MemoryHistory } from '../../../src/routing/history/MemoryHistory';
import harness from '../../../src/testing/harness';

const registry = new Registry();

const router = new Router(
	[
		{
			path: 'foo',
			outlet: 'foo'
		},
		{
			path: 'foo/{foo}',
			outlet: 'foo2'
		}
	],
	{ HistoryManager: MemoryHistory }
);

registry.defineInjector('router', () => () => router);

let routerSetPathSpy: SinonSpy;

function createMockEvent(
	options: { isRightClick?: boolean; metaKey?: boolean; ctrlKey?: boolean } = {
		isRightClick: false,
		metaKey: false,
		ctrlKey: false
	}
) {
	const { ctrlKey = false, metaKey = false, isRightClick = false } = options;

	return {
		defaultPrevented: false,
		preventDefault() {
			this.defaultPrevented = true;
		},
		button: isRightClick ? undefined : 0,
		metaKey,
		ctrlKey
	};
}

const noop: any = () => {};

const factory = create();

const mockGetRegistry = factory(() => {
	return () => {
		return registry;
	};
});

describe('Link', () => {
	beforeEach(() => {
		routerSetPathSpy = spy(router, 'setPath');
	});

	afterEach(() => {
		routerSetPathSpy.restore();
	});

	it('Generate link component for basic outlet', () => {
		const h = harness(() => w(Link, { to: 'foo' }), { middleware: [[getRegistry, mockGetRegistry]] });
		h.expect(() => v('a', { href: 'foo', onclick: noop }));
	});

	it('Generate link component for outlet with specified params', () => {
		const h = harness(() => w(Link, { to: 'foo2', params: { foo: 'foo' } }), {
			middleware: [[getRegistry, mockGetRegistry]]
		});
		h.expect(() => v('a', { href: 'foo/foo', onclick: noop }));
	});

	it('Generate link component for fixed href', () => {
		const h = harness(() => w(Link, { to: '#foo/static', isOutlet: false }), {
			middleware: [[getRegistry, mockGetRegistry]]
		});
		h.expect(() => v('a', { href: '#foo/static', onclick: noop }));
	});

	it('Set router path on click', () => {
		const h = harness(() => w(Link, { to: '#foo/static', isOutlet: false }), {
			middleware: [[getRegistry, mockGetRegistry]]
		});
		h.expect(() => v('a', { href: '#foo/static', onclick: noop }));
		h.trigger('a', 'onclick', createMockEvent());
		assert.isTrue(routerSetPathSpy.calledWith('#foo/static'));
	});

	it('Custom onClick handler can prevent default', () => {
		const h = harness(
			() =>
				w(Link, {
					to: 'foo',
					registry,
					onClick(event: MouseEvent) {
						event.preventDefault();
					}
				}),
			{ middleware: [[getRegistry, mockGetRegistry]] }
		);
		h.expect(() => v('a', { href: 'foo', registry, onclick: noop }));
		h.trigger('a', 'onclick', createMockEvent());
		assert.isTrue(routerSetPathSpy.notCalled);
	});

	it('Does not set router path when target attribute is set', () => {
		const h = harness(() => w(Link, { to: 'foo', target: '_blank' }), {
			middleware: [[getRegistry, mockGetRegistry]]
		});
		h.expect(() => v('a', { href: 'foo', onclick: noop }));
		h.trigger('a', 'onclick', createMockEvent());
		assert.isTrue(routerSetPathSpy.notCalled);
	});

	it('Does not set router path on right click', () => {
		const h = harness(() => w(Link, { to: 'foo' }), { middleware: [[getRegistry, mockGetRegistry]] });
		h.expect(() => v('a', { href: 'foo', onclick: noop }));
		h.trigger('a', 'onclick', createMockEvent({ isRightClick: true }));
		assert.isTrue(routerSetPathSpy.notCalled);
	});

	it('Does not set router path on ctrl click', () => {
		const h = harness(() => w(Link, { to: 'foo' }), { middleware: [[getRegistry, mockGetRegistry]] });
		h.expect(() => v('a', { href: 'foo', onclick: noop }));
		h.trigger('a', 'onclick', createMockEvent({ ctrlKey: true }));
		assert.isTrue(routerSetPathSpy.notCalled);
	});

	it('Does not set router path on meta click', () => {
		const h = harness(() => w(Link, { to: 'foo' }), { middleware: [[getRegistry, mockGetRegistry]] });
		h.expect(() => v('a', { href: 'foo', onclick: noop }));
		h.trigger('a', 'onclick', createMockEvent({ metaKey: true }));
		assert.isTrue(routerSetPathSpy.notCalled);
	});

	it('throw error if the injected router cannot be found with the router key', () => {
		try {
			harness(() => w(Link, { to: '#foo/static', isOutlet: false, routerKey: 'fake-key' }), {
				middleware: [[getRegistry, mockGetRegistry]]
			});
			assert.fail('Should throw an error when the injected router cannot be found with the routerKey');
		} catch (err) {
			// nothing to see here
		}
	});
});
