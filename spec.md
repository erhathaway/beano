```
<Router.Animate
    waitForParent // dont start this animation until parent is started // will hold off on mounting if haven't mounted yet
    parentOffset={200} // ms - time to offset from start of parent animation if any // will hold off on mounting if havent mounted yet
    onChange={when(isVisible, (id, finished) => anime({ targets: `#${id}`, translateX: 200 }).finished )}
>
    <Animateable>
        ...blah
    </Animateable>
<Router.Animate>
```

RefAnimation => (ref, finished) => any // gets the ref of the child and exposes a function to animate the child by it
CSSAnimation => string[] | string // applies a string or array of strings to the className of the child

1. Wait for component to mount
2. Run animation
3. Wait for animation to finish

https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components
