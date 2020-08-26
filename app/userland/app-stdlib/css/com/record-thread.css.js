import {css} from 'beaker://app-stdlib/vendor/lit-element/lit-element.js'
import buttonsCSS from 'beaker://app-stdlib/css/buttons2.css.js'
import inputsCSS from 'beaker://app-stdlib/css/inputs.css.js'
import tooltipCSS from 'beaker://app-stdlib/css/tooltip.css.js'
import spinnerCSS from 'beaker://app-stdlib/css/com/spinner.css.js'

const cssStr = css`
${buttonsCSS}
${inputsCSS}
${tooltipCSS}
${spinnerCSS}

:host {
  display: block;
  position: relative;
  background: var(--bg-color--light);
}

:host([full-page]) {
  background: transparent;
}

beaker-record {
  display: block;
}

.subject {
  background: var(--bg-color--default);
  border: 1px solid var(--border-color--light);
  border-radius: 4px;
  padding: 0 10px;
}

.subject beaker-record[render-mode="link"] {
  margin: 10px 6px;
}

:host([full-page]) .subject.card {
  margin-bottom: 10px;
}

.subject .simple-link {
  display: inline-block;
  margin: 10px 2px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  color: var(--text-color--link);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.subject .simple-link .spinner {
  width: 10px;
  height: 10px;
  margin-right: 5px;
  position: relative;
  top: 2px;
}

.subject .not-found:hover {
  text-decoration: underline;
}

.subject-content {
  background: var(--bg-color--default);
  padding: 0 16px;
  margin-bottom: 10px;
}

.subject-content > :-webkit-any(img, video, audio) {
  display: block;
  margin: 14px auto;
  max-width: 100%;
}

.subject-content > pre {
  max-width: 100%;
  overflow: auto;
}

.subject-content .markdown {
  line-height: 1.4;
  margin-bottom: 30px;
  font-size: 15px;
}

.subject-content .markdown :-webkit-any(h1, h2, h3, h4, h5) {
  font-family: arial;
}

.subject-content .markdown hr {
  border: 0;
  border-top: 1px solid var(--border-color--light);
  margin: 2em 0;
}

.subject-content .markdown blockquote {
  border-left: 10px solid var(--bg-color--semi-light);
  margin-left: 0;
  padding: 10px 30px;
}

.subject-content .markdown blockquote + blockquote {
  margin-top: -14px;
}

.subject-content .markdown blockquote p {
  margin: 0;
}

.subject-content .markdown * {
  max-width: 100%;
}

.comments {
  background: var(--bg-color--light);
  padding: 10px 0;
  border-radius: 4px;
}

:host([full-page]) .comments {
  padding: 10px;
}

.comments-header {
  margin: 0 4px 10px;
  font-size: 13px;
  color: var(--text-color--light);
}

.comments-header strong {
  color: var(--text-color--default);
}

.comment-prompt {
  padding: 10px 14px;
  border-radius: 4px;
  border: 1px solid var(--border-color--light);
  font-style: italic;
  background: var(--bg-color--default);
  color: var(--text-color--light);
}

.comment-prompt + .replies {
  margin-top: 10px;
}

.replies {
  margin: 0 0 0 15px;
  border-left: 1px solid var(--border-color--semi-light);
}

.replies beaker-record {
  display: block;
}


`
export default cssStr