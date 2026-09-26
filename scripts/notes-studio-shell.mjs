export function notesStudioBody() {
  return `
    <section class="notes-heading">
      <p class="blog-kicker" data-notes-text="kicker">Owner workspace</p>
      <h1 data-notes-text="title">Private notes</h1>
      <p data-notes-text="subtitle">Private by default. Publish a separate public version when ready.</p>
    </section>
    <section class="notes-auth" aria-labelledby="notesAuthTitle">
      <h2 id="notesAuthTitle" data-notes-text="connectTitle">Connect private repository</h2>
      <form id="notesConnectForm" autocomplete="off">
        <label for="notesToken" data-notes-text="token">GitHub fine-grained token</label>
        <div class="notes-connect-row">
          <input id="notesToken" type="password" autocomplete="off" spellcheck="false" required />
          <button class="btn btn-primary" id="notesConnect" type="submit" data-notes-text="connect">Connect</button>
        </div>
      </form>
      <div id="notesConnected" hidden>
        <span data-notes-text="connected">Connected as wcx12</span>
        <button class="btn btn-outline" id="notesLock" type="button" data-notes-text="lock">Lock workspace</button>
      </div>
      <details class="notes-help">
        <summary data-notes-text="accessHelp">Access and privacy</summary>
        <p data-notes-text="tokenHelp">Select wcx12-private-notes with Contents: Read and write. Also select wcx12 to publish or withdraw public articles. The token stays in memory until this page closes or locks.</p>
        <p data-notes-text="privateHelp">Saving writes only to the private repository. A draft is a writing status, not a visibility setting. GitHub and anyone you grant repository access to can read these notes.</p>
        <p data-notes-text="historyHelp">Withdrawing removes the article from the website after deployment, not from Git history, cached pages or copies. Existing public attachments remain public.</p>
        <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" data-notes-text="createToken">Create a token on GitHub</a>
      </details>
    </section>
    <p id="notesStatus" class="notes-status" role="status" aria-live="polite" data-notes-text="locked">Locked. No private content has been loaded.</p>
    <noscript><p>JavaScript is required to authenticate to your private repository. Private notes are never included in this page.</p></noscript>
    <section id="notesWorkspace" class="notes-workspace" hidden>
      <div class="notes-toolbar">
        <label class="notes-picker"><span data-notes-text="note">Private note</span><select id="notesList"></select></label>
        <button id="notesNew" type="button" class="btn btn-outline" data-notes-text="new">New note</button>
        <button id="notesReload" type="button" class="btn btn-outline" data-notes-text="reload">Reload</button>
        <button id="notesSave" type="button" class="btn btn-primary" data-notes-text="save">Save privately</button>
      </div>
      <details class="notes-import">
        <summary data-notes-text="importTitle">Manage an existing public article</summary>
        <div class="notes-connect-row">
          <select id="notesPublicList" aria-label="Public article"></select>
          <button id="notesImport" type="button" class="btn btn-outline" data-notes-text="import">Load private working copy</button>
        </div>
        <p data-notes-text="importHint">Importing does not hide the public article. Save the working copy, then use Withdraw to remove the public page. Language versions are managed separately.</p>
      </details>
      <div id="notesEditorArea" hidden>
        <div class="notes-visibility-row">
          <strong id="notesVisibility"></strong>
          <span id="notesSaved"></span>
          <a id="notesPublicLink" target="_blank" rel="noreferrer" hidden data-notes-text="viewPublic">View public page</a>
        </div>
        <form id="notesFields" class="notes-fields" autocomplete="off" spellcheck="false">
          <label class="notes-wide"><span data-notes-text="fieldTitle">Title</span><input id="noteTitle" maxlength="300" required /></label>
          <label class="notes-wide"><span data-notes-text="description">Description</span><textarea id="noteDescription" rows="2" maxlength="1000"></textarea></label>
          <label><span data-notes-text="slug">Public URL slug</span><input id="noteSlug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label>
          <label><span data-notes-text="language">Article language</span><select id="noteLang"><option value="zh">中文</option><option value="en">English</option></select></label>
          <label><span data-notes-text="writingStatus">Writing status</span><select id="noteWritingStatus"><option value="draft" data-notes-text="draft">Draft</option><option value="complete" data-notes-text="complete">Complete</option></select></label>
          <label><span data-notes-text="category">Category</span><select id="noteCategory">
            <option>Research Notes</option><option>Computer Vision</option><option>Point Cloud</option><option>Large Models</option><option>AI for Education</option><option>Engineering</option>
          </select></label>
          <label><span data-notes-text="date">Article date</span><input id="noteDate" type="date" required /></label>
          <label><span data-notes-text="tags">Tags (comma-separated)</span><input id="noteTags" placeholder="research, notes" /></label>
        </form>
        <div class="notes-editor-grid">
          <section class="notes-editor-pane" aria-labelledby="notesMarkdownTitle">
            <h2 id="notesMarkdownTitle">Markdown</h2>
            <textarea id="noteBody" aria-label="Markdown" spellcheck="false"></textarea>
          </section>
          <section class="notes-preview-pane" aria-labelledby="notesPreviewTitle">
            <h2 id="notesPreviewTitle" data-notes-text="preview">Preview</h2>
            <div id="notesPreview" class="blog-content"></div>
          </section>
        </div>
        <div class="notes-public-actions">
          <button id="notesPublish" type="button" class="btn btn-outline" data-notes-text="publish">Publish public version</button>
          <button id="notesWithdraw" type="button" class="btn btn-outline" data-notes-text="withdraw" disabled>Withdraw public version</button>
          <a href="https://github.com/wcx12/wcx12/actions/workflows/blog-build.yml" target="_blank" rel="noreferrer" data-notes-text="deployment">Deployment status</a>
        </div>
      </div>
      <p id="notesEmpty" data-notes-text="empty">No private notes yet.</p>
    </section>
    <dialog id="notesConfirm" class="notes-confirm" aria-labelledby="notesConfirmTitle">
      <h2 id="notesConfirmTitle"></h2>
      <p id="notesConfirmMessage"></p>
      <label class="notes-confirm-check"><input id="notesConfirmCheck" type="checkbox" /><span data-notes-text="understand">I understand and confirm this action.</span></label>
      <div class="notes-confirm-actions">
        <button id="notesCancel" class="btn btn-outline" type="button" data-notes-text="cancel">Cancel</button>
        <button id="notesConfirmAction" class="btn btn-primary" type="button" disabled data-notes-text="confirm">Confirm</button>
      </div>
    </dialog>`;
}
