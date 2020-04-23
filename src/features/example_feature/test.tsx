import React from 'react';
import ExampleFeature from './index';
import renderer from 'react-test-renderer';

describe('ExampleFeature', () => {
    it('renders correctly', () => {
        const tree = renderer.create(<ExampleFeature />).toJSON();
        expect(tree).toMatchInlineSnapshot(`
            <div
              className="sc-bdVaJa fYXGIz"
              id="example-feature-animation"
              onClick={[Function]}
            >
              My State is: 
              TRUE
            </div>
        `);
    });
});
