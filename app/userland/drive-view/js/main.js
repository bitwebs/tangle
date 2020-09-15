import { LitElement, html } from 'beaker://app-stdlib/vendor/lit-element/lit-element.js'
import { ViewThreadPopup } from 'beaker://app-stdlib/js/com/popups/view-thread.js'
import { SitesListPopup } from 'beaker://app-stdlib/js/com/popups/sites-list.js'
import { NewPagePopup } from 'beaker://app-stdlib/js/com/popups/new-page.js'
import { NewPostPopup } from 'beaker://app-stdlib/js/com/popups/new-post.js'
import * as contextMenu from 'beaker://app-stdlib/js/com/context-menu.js'
import { shorten, pluralize, isSameOrigin } from 'beaker://app-stdlib/js/strings.js'
import { typeToQuery } from 'beaker://app-stdlib/js/records.js'
import css from '../css/main.css.js'
import './views/files-list.js'
import './views/index-md.js'
import 'beaker://app-stdlib/js/com/record-feed.js'
import 'beaker://app-stdlib/js/com/record-thread.js'

const NAV_ITEMS = [
  {type: undefined, path: '/', icon: 'fas fa-home', label: 'Home'},
  {type: 'bookmark', path: '/bookmarks/', icon: 'far fa-star', label: 'Bookmarks'},
  {type: 'blogpost', path: '/blog/', icon: 'fas fa-blog', label: 'Blog'},
  {type: 'page', path: '/pages/', icon: 'far fa-file', label: 'Pages'},
  {type: 'microblogpost', path: '/microblog/', icon: 'far fa-comment-alt', label: 'Posts'},
  {type: 'comment', path: '/comments/', icon: 'far fa-comments', label: 'Comments'},
  {type: 'subscription', path: '/subscriptions/', icon: 'fas fa-rss', label: 'Subscriptions'}
]
const FILE_QUERIES = {
  bookmarks: [typeToQuery('bookmark')],
  blogposts: [typeToQuery('blogpost')],
  pages: [typeToQuery('page')],
  microblogposts: [typeToQuery('microblogpost')],
  comments: [typeToQuery('comment')],
  subscriptions: [typeToQuery('subscription')]
}
FILE_QUERIES.all = Object.values(FILE_QUERIES).flat()

class DriveViewApp extends LitElement {
  static get styles () {
    return css
  }

  constructor () {
    super()
    this.drive = beaker.hyperdrive.drive(location)
    this.info = undefined
    this.profile = undefined
    this.contentCounts = undefined
    this.showFilesOverride = false
    this.subscribers = []
    this.isSubscribedToUser = false
    this.hasThumb = true
    this.load()
  }

  async load () {
    if (location.origin.startsWith('hyper://private')) {
      this.classList.add('private')
    }

    let addressBook = await beaker.hyperdrive.readFile('hyper://private/address-book.json', 'json').catch(e => undefined)
    this.profile = await beaker.index.getSite(addressBook?.profiles?.[0]?.key)
    
    beaker.index.getSite(window.location.origin).then(info => {
      this.info = info
      console.log(this.info)
      this.requestUpdate()
    })
    beaker.subscriptions.listNetworkFor(window.location.origin).then(subs => {
      this.subscribers = subs
      this.requestUpdate()
    })
    beaker.index.count({
      file: {prefix: '/subscriptions', extension: '.goto'},
      links: this.profile.url,
      origin: window.location.origin
    }).then(count => {
      this.isSubscribedToUser = count !== 0
      this.requestUpdate()
    })
    this.contentCounts = Object.fromEntries(
      await Promise.all(
        Object.entries({
          bookmark: FILE_QUERIES.bookmarks,
          blogpost: FILE_QUERIES.blogposts,
          page: FILE_QUERIES.pages,
          microblogpost: FILE_QUERIES.microblogposts,
          comment: FILE_QUERIES.comments,
          subscription: FILE_QUERIES.subscriptions
        }).map(([key, file]) => (
          beaker.index.count({
            file,
            origin: window.location.origin
          }).then(count => ([key, count]))
        ))
      )
    )
    this.requestUpdate()
  }

  get isDirectory () {
    return location.pathname.endsWith('/')
  }

  get isSubscribed () {
    return this.subscribers.find(s => s.site.url === this.profile.url)
  }

  get isSystem () {
    return location.origin.startsWith('hyper://private') || isSameOrigin(location.origin, this.profile?.url)
  }

  render () {
    if (!this.info) return html``
    const navItem = ({type, path, icon, label}) => {
      let count = 0
      if (type) {
        count = this.contentCounts?.[type]
        if (!count) return ''
      }
      if (count > 0) label += ` (${count})`
      return html`
        <a class="nav-item ${location.pathname === path ? 'current' : ''}" href=${path} data-tooltip=${label}>
          <span class="fa-fw ${icon}"></span>
          <span class="label">${label}</span>
        </a>
      `
    }
    const showSubs = !(isSameOrigin(this.info.origin, 'hyper://private') || this.info.writable && !this.subscribers?.length)
    return html`
      <link rel="stylesheet" href="beaker://app-stdlib/css/fontawesome.css">
      <div class="content">
        <beaker-index-md .info=${this.info}></beaker-index-md>
        ${this.isDirectory ? this.renderDirectory() : this.renderFile()}
      </div>
      <div class="sidebar ${this.hasThumb ? '' : 'no-thumb'}">
        <div class="sidebar-inner">
          <div class="thumb">
            <a href="/">
              ${location.origin.startsWith('hyper://private') ? html`
                <span class="sysicon"><span class="fas fa-lock"></span></span>
              ` : html`
                <img src="/thumb" @error=${this.onThumbFail}>
              `}
            </a>
          </div>
          <div class="title"><a href="/">${this.info.title || 'Untitled'}</a></div>
          <div class="description">${this.info.description || ''}</div>
          ${!showSubs ? '' : html`
            <div class="known-subscribers">
              ${this.isSubscribedToUser ? html`
                <span class="subscribed-to-you"><span>Subscribed to you</span></span>
              `: ''}
              <a
                href="#"
                class="tooltip-left"
                @click=${this.onClickShowSubscribers}
                data-tooltip=${shorten(this.subscribers?.map(r => r.site.title || 'Untitled').join(', ') || '', 100)}
              >
                <strong>${this.subscribers?.length}</strong>
                ${pluralize(this.subscribers?.length || 0, 'subscriber')}
              </a>
            </div>
          `}
          ${this.renderHeaderButtons()}
        </div>
        <div class="nav">
          ${NAV_ITEMS.map(navItem)}
        </div>
      </div>
    `
  }

  renderHeaderButtons () {
    return html`
      <div class="btns">
        ${isSameOrigin(this.info.origin, 'hyper://private') ? '' : this.info.writable ? html`
          <button class="transparent" @click=${this.onEditProperties}>
            Edit Profile
          </button>
          <button class="transparent" @click=${this.onClickMoreTools}>
            <span class="fas fa-caret-down"></span>
          </button>
        ` : html`
          <button class="transparent" @click=${this.onToggleSubscribe}>
            ${this.isSubscribed ? html`
              <span class="fas fa-fw fa-check"></span> Subscribed
            ` : html`
              <span class="fas fa-fw fa-rss"></span> Subscribe
            `}
          </button>
        `}
      </div>
    `
  }

  renderDirectory () {
    if (this.showFilesOverride) {
      return html`<beaker-files-list .info=${this.info}></beaker-files-list>`
    }
    switch (location.pathname) {
      case '/':
        return html`
          <beaker-record-feed
            .fileQuery=${FILE_QUERIES.all}
            .sources=${[this.info.origin]}
            show-date-titles
            date-title-range="month"
            limit="50"
            profile-url=${this.profile.url}
            @view-thread=${this.onViewThread}
            @load-state-updated=${this.onFeedLoadStateUpdated}
          ></beaker-record-feed>
        `
      case '/microblog/':
        return html`
          <beaker-record-feed
            .fileQuery=${FILE_QUERIES.microblogposts}
            .sources=${[this.info.origin]}
            show-date-titles
            date-title-range="month"
            limit="50"
            profile-url=${this.profile.url}
            @view-thread=${this.onViewThread}
            @load-state-updated=${this.onFeedLoadStateUpdated}
          ></beaker-record-feed>
        `
      case '/blog/':
        return html`
          <beaker-record-feed
            .fileQuery=${FILE_QUERIES.blogposts}
            .sources=${[this.info.origin]}
            show-date-titles
            date-title-range="month"
            limit="50"
            profile-url=${this.profile.url}
            @view-thread=${this.onViewThread}
            @load-state-updated=${this.onFeedLoadStateUpdated}
          ></beaker-record-feed>
        `
      case '/pages/':
        return html`
          <beaker-record-feed
            .fileQuery=${FILE_QUERIES.pages}
            .sources=${[this.info.origin]}
            show-date-titles
            date-title-range="month"
            limit="50"
            profile-url=${this.profile.url}
            @view-thread=${this.onViewThread}
            @load-state-updated=${this.onFeedLoadStateUpdated}
          ></beaker-record-feed>
        `
      case '/bookmarks/':
        return html`
          <beaker-record-feed
            .fileQuery=${FILE_QUERIES.bookmarks}
            .sources=${[this.info.origin]}
            show-date-titles
            date-title-range="month"
            limit="50"
            profile-url=${this.profile.url}
            @view-thread=${this.onViewThread}
            @load-state-updated=${this.onFeedLoadStateUpdated}
          ></beaker-record-feed>
        `
      case '/comments/':
        return html`
          <beaker-record-feed
            .fileQuery=${FILE_QUERIES.comments}
            .sources=${[this.info.origin]}
            show-date-titles
            date-title-range="month"
            limit="50"
            profile-url=${this.profile.url}
            @view-thread=${this.onViewThread}
            @load-state-updated=${this.onFeedLoadStateUpdated}
          ></beaker-record-feed>
        `
      case '/subscriptions/':
        return html`
          <beaker-record-feed
            .fileQuery=${FILE_QUERIES.subscriptions}
            .sources=${[this.info.origin]}
            show-date-titles
            date-title-range="month"
            no-merge
            limit="50"
            profile-url=${this.profile.url}
            @view-thread=${this.onViewThread}
            @load-state-updated=${this.onFeedLoadStateUpdated}
          ></beaker-record-feed>
        `
      default:
        return html`<beaker-files-list .info=${this.info}></beaker-files-list>`
    }
  }

  renderFile () {
    return html`
      <beaker-record-thread
        record-url=${window.location.toString()}
        full-page
        set-document-title
        profile-url=${this.profile?.url}
      ></beaker-record-thread>
    `
  }

  // events
  // =


  onFeedLoadStateUpdated (e) {
    if (e.detail?.isEmpty === true) {
      // on empty feeds, fallback to the files list view
      this.showFilesOverride = true
      this.requestUpdate()
    }
  }


  onViewThread (e) {
    ViewThreadPopup.create({
      recordUrl: e.detail.record.url,
      profileUrl: this.profile.url
    })
  }

  async onToggleSubscribe () {
    if (this.isSubscribed) {
      this.subscribers = this.subscribers.filter(s => s.site.url !== this.profile.url)
      this.requestUpdate()
      await beaker.subscriptions.remove(this.info.origin)
    } else {
      this.subscribers = this.subscribers.concat([{site: this.profile}])
      this.requestUpdate()
      await beaker.subscriptions.add({
        href: this.info.origin,
        title: this.info.title,
        site: this.profile.url
      })
    }
    this.subscribers = await beaker.subscriptions.listNetworkFor(this.siteInfo.url)
  }

  async onEditProperties () {
    await beaker.shell.drivePropertiesDialog(this.info.origin)
    location.reload()
  }

  async onClickMoreTools (e) {
    e.preventDefault()
    e.stopPropagation()
    var rect = e.currentTarget.getClientRects()[0]
    const items = [
      {icon: 'far fa-comment', label: 'New Post', click: this.onClickNewPost},
      {icon: 'far fa-file', label: 'New Page', click: this.onClickNewPage}
    ]
    if (!this.isSystem) {
      items.unshift('-')
      items.unshift(this.isSubscribed
        ? {icon: 'fas fa-times', label: 'Unsubscribe', click: this.onToggleSubscribe}
        : {icon: 'fas fa-rss', label: 'Subscribe', click: this.onToggleSubscribe},
      )
    }
    contextMenu.create({
      x: rect.right,
      y: rect.bottom,
      noBorders: true,
      right: true,
      style: `padding: 6px 0`,
      items
    })
  }

  async onClickNewPage () {
    try {
      var res = await NewPagePopup.create({driveUrl: location.origin})
      window.location = res.url
    } catch (e) {
      // ignore
      console.log(e)
    }
  }

  async onClickNewPost () {
    try {
      await NewPostPopup.create({driveUrl: location.origin})
    } catch (e) {
      // ignore, user probably cancelled
      console.log(e)
      return
    }
    window.location.reload()
  }

  onClickShowSubscribers (e) {
    e.preventDefault()
    e.stopPropagation()
    SitesListPopup.create('Subscribers', this.subscribers.map(s => s.site))
  }

  onThumbFail (e) {
    this.hasThumb = false
    this.requestUpdate()
  }
}

customElements.define('beaker-drive-view', DriveViewApp)
document.body.append(new DriveViewApp())