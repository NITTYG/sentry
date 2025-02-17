import {mountWithTheme} from 'sentry-test/enzyme';

import MemberListStore from 'sentry/stores/memberListStore';
import TagStore from 'sentry/stores/tagStore';
import TeamStore from 'sentry/stores/teamStore';
import withIssueTags from 'sentry/utils/withIssueTags';

describe('withIssueTags HoC', function () {
  beforeEach(() => {
    TagStore.reset();
    MemberListStore.loadInitialData([]);
  });

  it('forwards loaded tags to the wrapped component', async function () {
    const MyComponent = () => null;
    const Container = withIssueTags(MyComponent);
    const wrapper = mountWithTheme(<Container other="value" />);

    // Should forward props.
    expect(wrapper.find('MyComponent').prop('other')).toEqual('value');

    TagStore.onLoadTagsSuccess([{name: 'Mechanism', key: 'mechanism', count: 1}]);
    await wrapper.update();

    // Should forward prop
    expect(wrapper.find('MyComponent').prop('other')).toEqual('value');

    const tagsProp = wrapper.find('MyComponent').prop('tags');
    // includes custom tags
    expect(tagsProp.mechanism).toBeTruthy();

    // should include special issue and attributes.
    expect(tagsProp.is).toBeTruthy();
    expect(tagsProp.bookmarks).toBeTruthy();
    expect(tagsProp.assigned).toBeTruthy();
    expect(tagsProp['stack.filename']).toBeTruthy();
  });

  it('updates the assigned tags with users and teams, and bookmark tags with users', async function () {
    const MyComponent = () => null;
    const Container = withIssueTags(MyComponent);
    const wrapper = mountWithTheme(<Container other="value" />);

    // Should forward props.
    expect(wrapper.find('MyComponent').prop('other')).toEqual('value');

    TagStore.onLoadTagsSuccess([{name: 'Mechanism', key: 'mechanism', count: 1}]);
    await wrapper.update();

    let tagsProp = wrapper.find('MyComponent').prop('tags');
    expect(tagsProp.assigned).toBeTruthy();
    expect(tagsProp.assigned.values).toEqual(['me', '[me, none]']);

    expect(tagsProp.assigned_or_suggested).toBeTruthy();
    expect(tagsProp.assigned_or_suggested.values).toEqual(['me', '[me, none]']);

    const users = [TestStubs.User(), TestStubs.User({username: 'joe@example.com'})];
    TeamStore.loadInitialData([
      {slug: 'best-team-na', name: 'Best Team NA', isMember: true},
    ]);
    MemberListStore.loadInitialData(users);
    await wrapper.update();

    tagsProp = wrapper.find('MyComponent').prop('tags');
    expect(tagsProp.assigned.values).toEqual([
      'me',
      '[me, none]',
      'foo@example.com',
      'joe@example.com',
      '#best-team-na',
    ]);
    expect(tagsProp.assigned_or_suggested.values).toEqual([
      'me',
      '[me, none]',
      'foo@example.com',
      'joe@example.com',
      '#best-team-na',
    ]);
    expect(tagsProp.bookmarks.values).toEqual([
      'me',
      'foo@example.com',
      'joe@example.com',
    ]);
  });
});
