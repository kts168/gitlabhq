/* eslint-disable no-var, comma-dangle, object-shorthand */
/* global Notes */

import '~/merge_request_tabs';
import '~/commit/pipelines/pipelines_bundle';
import '~/breakpoints';
import '~/lib/utils/common_utils';
import Diff from '~/diff';
import '~/notes';
import 'vendor/jquery.scrollTo';

(function () {
  describe('MergeRequestTabs', function () {
    var stubLocation = {};
    var setLocation = function (stubs) {
      var defaults = {
        pathname: '',
        search: '',
        hash: ''
      };
      $.extend(stubLocation, defaults, stubs || {});
    };

    const inlineChangesTabJsonFixture = 'merge_request_diffs/inline_changes_tab_with_comments.json';
    const parallelChangesTabJsonFixture = 'merge_request_diffs/parallel_changes_tab_with_comments.json';
    preloadFixtures(
      'merge_requests/merge_request_with_task_list.html.raw',
      'merge_requests/diff_comment.html.raw',
      inlineChangesTabJsonFixture,
      parallelChangesTabJsonFixture
    );

    beforeEach(function () {
      this.class = new gl.MergeRequestTabs({ stubLocation: stubLocation });
      setLocation();

      this.spies = {
        history: spyOn(window.history, 'replaceState').and.callFake(function () {})
      };
    });

    afterEach(function () {
      this.class.unbindEvents();
      this.class.destroyPipelinesView();
    });

    describe('activateTab', function () {
      beforeEach(function () {
        spyOn($, 'ajax').and.callFake(function () {});
        loadFixtures('merge_requests/merge_request_with_task_list.html.raw');
        this.subject = this.class.activateTab;
      });
      it('shows the notes tab when action is show', function () {
        this.subject('show');
        expect($('#notes')).toHaveClass('active');
      });
      it('shows the commits tab when action is commits', function () {
        this.subject('commits');
        expect($('#commits')).toHaveClass('active');
      });
      it('shows the diffs tab when action is diffs', function () {
        this.subject('diffs');
        expect($('#diffs')).toHaveClass('active');
      });
    });

    describe('opensInNewTab', function () {
      var tabUrl;
      var windowTarget = '_blank';

      beforeEach(function () {
        loadFixtures('merge_requests/merge_request_with_task_list.html.raw');

        tabUrl = $('.commits-tab a').attr('href');

        spyOn($.fn, 'attr').and.returnValue(tabUrl);
      });

      describe('meta click', () => {
        let metakeyEvent;
        beforeEach(function () {
          metakeyEvent = $.Event('click', { keyCode: 91, ctrlKey: true });
        });

        it('opens page when commits link is clicked', function () {
          spyOn(window, 'open').and.callFake(function (url, name) {
            expect(url).toEqual(tabUrl);
            expect(name).toEqual(windowTarget);
          });

          this.class.bindEvents();
          $('.merge-request-tabs .commits-tab a').trigger(metakeyEvent);
        });

        it('opens page when commits badge is clicked', function () {
          spyOn(window, 'open').and.callFake(function (url, name) {
            expect(url).toEqual(tabUrl);
            expect(name).toEqual(windowTarget);
          });

          this.class.bindEvents();
          $('.merge-request-tabs .commits-tab a .badge').trigger(metakeyEvent);
        });
      });

      it('opens page tab in a new browser tab with Ctrl+Click - Windows/Linux', function () {
        spyOn(window, 'open').and.callFake(function (url, name) {
          expect(url).toEqual(tabUrl);
          expect(name).toEqual(windowTarget);
        });

        this.class.clickTab({
          metaKey: false,
          ctrlKey: true,
          which: 1,
          stopImmediatePropagation: function () {}
        });
      });

      it('opens page tab in a new browser tab with Cmd+Click - Mac', function () {
        spyOn(window, 'open').and.callFake(function (url, name) {
          expect(url).toEqual(tabUrl);
          expect(name).toEqual(windowTarget);
        });

        this.class.clickTab({
          metaKey: true,
          ctrlKey: false,
          which: 1,
          stopImmediatePropagation: function () {}
        });
      });

      it('opens page tab in a new browser tab with Middle-click - Mac/PC', function () {
        spyOn(window, 'open').and.callFake(function (url, name) {
          expect(url).toEqual(tabUrl);
          expect(name).toEqual(windowTarget);
        });

        this.class.clickTab({
          metaKey: false,
          ctrlKey: false,
          which: 2,
          stopImmediatePropagation: function () {}
        });
      });
    });

    describe('setCurrentAction', function () {
      beforeEach(function () {
        spyOn($, 'ajax').and.callFake(function () {});
        this.subject = this.class.setCurrentAction;
      });

      it('changes from commits', function () {
        setLocation({
          pathname: '/foo/bar/merge_requests/1/commits'
        });
        expect(this.subject('show')).toBe('/foo/bar/merge_requests/1');
        expect(this.subject('diffs')).toBe('/foo/bar/merge_requests/1/diffs');
      });

      it('changes from diffs', function () {
        setLocation({
          pathname: '/foo/bar/merge_requests/1/diffs'
        });

        expect(this.subject('show')).toBe('/foo/bar/merge_requests/1');
        expect(this.subject('commits')).toBe('/foo/bar/merge_requests/1/commits');
      });

      it('changes from diffs.html', function () {
        setLocation({
          pathname: '/foo/bar/merge_requests/1/diffs.html'
        });
        expect(this.subject('show')).toBe('/foo/bar/merge_requests/1');
        expect(this.subject('commits')).toBe('/foo/bar/merge_requests/1/commits');
      });

      it('changes from notes', function () {
        setLocation({
          pathname: '/foo/bar/merge_requests/1'
        });
        expect(this.subject('diffs')).toBe('/foo/bar/merge_requests/1/diffs');
        expect(this.subject('commits')).toBe('/foo/bar/merge_requests/1/commits');
      });

      it('includes search parameters and hash string', function () {
        setLocation({
          pathname: '/foo/bar/merge_requests/1/diffs',
          search: '?view=parallel',
          hash: '#L15-35'
        });
        expect(this.subject('show')).toBe('/foo/bar/merge_requests/1?view=parallel#L15-35');
      });

      it('replaces the current history state', function () {
        var newState;
        setLocation({
          pathname: '/foo/bar/merge_requests/1'
        });
        newState = this.subject('commits');
        expect(this.spies.history).toHaveBeenCalledWith({
          url: newState
        }, document.title, newState);
      });

      it('treats "show" like "notes"', function () {
        setLocation({
          pathname: '/foo/bar/merge_requests/1/commits'
        });
        expect(this.subject('show')).toBe('/foo/bar/merge_requests/1');
      });
    });

    describe('tabShown', () => {
      beforeEach(function () {
        spyOn($, 'ajax').and.callFake(function (options) {
          options.success({ html: '' });
        });
        loadFixtures('merge_requests/merge_request_with_task_list.html.raw');
      });

      describe('with "Side-by-side"/parallel diff view', () => {
        beforeEach(function () {
          this.class.diffViewType = () => 'parallel';
          Diff.prototype.diffViewType = () => 'parallel';
        });

        it('maintains `container-limited` for pipelines tab', function (done) {
          const asyncClick = function (selector) {
            return new Promise((resolve) => {
              setTimeout(() => {
                document.querySelector(selector).click();
                resolve();
              });
            });
          };
          asyncClick('.merge-request-tabs .pipelines-tab a')
            .then(() => asyncClick('.merge-request-tabs .diffs-tab a'))
            .then(() => asyncClick('.merge-request-tabs .pipelines-tab a'))
            .then(() => {
              const hasContainerLimitedClass = document.querySelector('.content-wrapper .container-fluid').classList.contains('container-limited');
              expect(hasContainerLimitedClass).toBe(true);
            })
            .then(done)
            .catch((err) => {
              done.fail(`Something went wrong clicking MR tabs: ${err.message}\n${err.stack}`);
            });
        });

        it('maintains `container-limited` when switching from "Changes" tab before it loads', function (done) {
          const asyncClick = function (selector) {
            return new Promise((resolve) => {
              setTimeout(() => {
                document.querySelector(selector).click();
                resolve();
              });
            });
          };

          asyncClick('.merge-request-tabs .diffs-tab a')
            .then(() => asyncClick('.merge-request-tabs .notes-tab a'))
            .then(() => {
              const hasContainerLimitedClass = document.querySelector('.content-wrapper .container-fluid').classList.contains('container-limited');
              expect(hasContainerLimitedClass).toBe(true);
            })
            .then(done)
            .catch((err) => {
              done.fail(`Something went wrong clicking MR tabs: ${err.message}\n${err.stack}`);
            });
        });
      });
    });

    describe('loadDiff', function () {
      beforeEach(() => {
        loadFixtures('merge_requests/diff_comment.html.raw');
        $('body').attr('data-page', 'projects:merge_requests:show');
        window.gl.ImageFile = () => {};
        window.notes = new Notes('', []);
        spyOn(window.notes, 'toggleDiffNote').and.callThrough();
      });

      afterEach(() => {
        delete window.gl.ImageFile;
        delete window.notes;

        // Undo what we did to the shared <body>
        $('body').removeAttr('data-page');
      });

      it('requires an absolute pathname', function () {
        spyOn($, 'ajax').and.callFake(function (options) {
          expect(options.url).toEqual('/foo/bar/merge_requests/1/diffs.json');
        });

        this.class.loadDiff('/foo/bar/merge_requests/1/diffs');
      });

      it('triggers scroll event when diff already loaded', function () {
        spyOn(document, 'dispatchEvent');

        this.class.diffsLoaded = true;
        this.class.loadDiff('/foo/bar/merge_requests/1/diffs');

        expect(
          document.dispatchEvent,
        ).toHaveBeenCalledWith(new CustomEvent('scroll'));
      });

      describe('with inline diff', () => {
        let noteId;
        let noteLineNumId;

        beforeEach(() => {
          const diffsResponse = getJSONFixture(inlineChangesTabJsonFixture);

          const $html = $(diffsResponse.html);
          noteId = $html.find('.note').attr('id');
          noteLineNumId = $html
            .find('.note')
            .closest('.notes_holder')
            .prev('.line_holder')
            .find('a[data-linenumber]')
            .attr('href')
            .replace('#', '');

          spyOn($, 'ajax').and.callFake(function (options) {
            options.success(diffsResponse);
          });
        });

        describe('with note fragment hash', () => {
          it('should expand and scroll to linked fragment hash #note_xxx', function () {
            spyOn(window.gl.utils, 'getLocationHash').and.returnValue(noteId);
            this.class.loadDiff('/foo/bar/merge_requests/1/diffs');

            expect(noteId.length).toBeGreaterThan(0);
            expect(window.notes.toggleDiffNote).toHaveBeenCalledWith({
              target: jasmine.any(Object),
              lineType: 'old',
              forceShow: true,
            });
          });

          it('should gracefully ignore non-existant fragment hash', function () {
            spyOn(window.gl.utils, 'getLocationHash').and.returnValue('note_something-that-does-not-exist');
            this.class.loadDiff('/foo/bar/merge_requests/1/diffs');

            expect(window.notes.toggleDiffNote).not.toHaveBeenCalled();
          });
        });

        describe('with line number fragment hash', () => {
          it('should gracefully ignore line number fragment hash', function () {
            spyOn(window.gl.utils, 'getLocationHash').and.returnValue(noteLineNumId);
            this.class.loadDiff('/foo/bar/merge_requests/1/diffs');

            expect(noteLineNumId.length).toBeGreaterThan(0);
            expect(window.notes.toggleDiffNote).not.toHaveBeenCalled();
          });
        });
      });

      describe('with parallel diff', () => {
        let noteId;
        let noteLineNumId;

        beforeEach(() => {
          const diffsResponse = getJSONFixture(parallelChangesTabJsonFixture);

          const $html = $(diffsResponse.html);
          noteId = $html.find('.note').attr('id');
          noteLineNumId = $html
            .find('.note')
            .closest('.notes_holder')
            .prev('.line_holder')
            .find('a[data-linenumber]')
            .attr('href')
            .replace('#', '');

          spyOn($, 'ajax').and.callFake(function (options) {
            options.success(diffsResponse);
          });
        });

        describe('with note fragment hash', () => {
          it('should expand and scroll to linked fragment hash #note_xxx', function () {
            spyOn(window.gl.utils, 'getLocationHash').and.returnValue(noteId);

            this.class.loadDiff('/foo/bar/merge_requests/1/diffs');

            expect(noteId.length).toBeGreaterThan(0);
            expect(window.notes.toggleDiffNote).toHaveBeenCalledWith({
              target: jasmine.any(Object),
              lineType: 'new',
              forceShow: true,
            });
          });

          it('should gracefully ignore non-existant fragment hash', function () {
            spyOn(window.gl.utils, 'getLocationHash').and.returnValue('note_something-that-does-not-exist');
            this.class.loadDiff('/foo/bar/merge_requests/1/diffs');

            expect(window.notes.toggleDiffNote).not.toHaveBeenCalled();
          });
        });

        describe('with line number fragment hash', () => {
          it('should gracefully ignore line number fragment hash', function () {
            spyOn(window.gl.utils, 'getLocationHash').and.returnValue(noteLineNumId);
            this.class.loadDiff('/foo/bar/merge_requests/1/diffs');

            expect(noteLineNumId.length).toBeGreaterThan(0);
            expect(window.notes.toggleDiffNote).not.toHaveBeenCalled();
          });
        });
      });
    });

    describe('expandViewContainer', function () {
      beforeEach(() => {
        $('body').append('<div class="content-wrapper"><div class="container-fluid container-limited"></div></div>');
      });

      afterEach(() => {
        $('.content-wrapper').remove();
      });

      it('removes container-limited from containers', function () {
        this.class.expandViewContainer();

        expect($('.content-wrapper')).not.toContainElement('.container-limited');
      });

      it('does remove container-limited from breadcrumbs', function () {
        $('.container-limited').addClass('breadcrumbs');
        this.class.expandViewContainer();

        expect($('.content-wrapper')).toContainElement('.container-limited');
      });
    });
  });
}).call(window);
