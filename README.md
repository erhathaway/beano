# react-typescript-parcel-boilerplate
[![Actions Status](https://github.com/erhathaway/react-typescript-parcel-boilerplate/workflows/Continous%20Integration/badge.svg)](https://github.com/erhathaway/react-typescript-parcel-boilerplate/actions)

![](https://api.dependabot.com/badges/status?host=github&repo=erhathaway/react-typescript-parcel-boilerplate)

An opinionated React,Typescript, and Parcel boilerplate

...with MobX, Styled-Components, and AnimeJS along for the ride

# About

-   Styling is handled by [Styled-Components](https://www.styled-components.com/)
-   Animations are handled by [AnimeJS](https://animejs.com/)
-   Business logic is handled by [MobX](https://mobx.js.org/README.html)
-   Continuous Integration (CI) is done via [GitHub Actions](https://github.com/features/actions)
-   Testing supports Typescript and uses React Test Renderer
    -   In the example app, tests are colocated next to the file they test and snapshots are run inline for easier reading
-   ESLint is configured to work with Typescript, Prettier, and Jest
-   Husky is added for git-hooks. The pre-commit hook checks similar things as the CI

# Usage

1. Edit the `package.json` file and specify project attributes. All of the following should be customized:

    - `name`
    - `version`
    - `description`
    - `repository`
    - `author`
    - `license`
    - `bugs`
    - `homepage`

2. Edit the `.github/CODEOWNERS` file and add your github user name

3. Edit the Continuous Integration badge in the `README.md`. [See the github docs on action badges](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/configuring-a-workflow#adding-a-workflow-status-badge-to-your-repository)
4. Edit (or delete) the Dependabot badge in the `README.md`. Use `<username>/<reponame>` syntax
5. Install the dependencies `npm install` or `yarn install`
6. Run the example app `npm run start`

# Architecture

The example app architecture follows an MVC paradigm. The `M` = `State`, `V` = `Features`, and the `C` = `Layouts`. Thus, you compose a layout of features and interplate state into those features. In my opinion, this helps separate the view layer from the business layer and makes it easy to do feature development and maintance on the code base.

-   `src/layouts`: The app is organized around `layouts`. `Layouts` describe how `Features` visually appear with respect to one another. Interactions among `Features`, like animations, routing, and viewport adjustments should be handled at the layout level.
-   `src/features` `Features` are isolated units. `State` is bound to `Features` via the React Context API and MobX. `Features` should only be a view layer - all business logic should be interpolated into the view layer... not defined in the view layer!.
-   `src/state`: Business logic is stored in the `state` folder. This logic is written in a functional reactive paradigm - hence the usage of MobX.
-   `src/context`: The place where state is bound to the Context API. Business logic is instantiated here.
