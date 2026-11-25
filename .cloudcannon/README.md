# Editing this site

This is the Global Finance Starter website: a home page, campaign landing pages, and a library of reports. Everything you can see on the site can be edited here.

## Quick links

- [Pages](cloudcannon:collections/pages) - the home page, landing pages and the reports index
- [Reports](cloudcannon:collections/reports) - the long-form reports
- [Site settings](cloudcannon:collections/data) - logo, brand colour, navigation and footer
- [Translations](cloudcannon:collections/locales) - the Spanish text of the site

## Pages

Each page is a stack of sections. Open a page to edit it visually: click any text or image to change it, or use the **Sections** list in the sidebar to add, remove and reorder sections.

The sections you can add are:

| Section | What it shows |
| --- | --- |
| Hero | Full-width photo with a headline, an optional button and optional partner logos |
| Split banner | A card with text on one side and an image on the other |
| Features | A title above a row of feature cards |
| Stats | A title and lead text above a row of key figures |
| Featured reports | A hand-picked selection of reports |
| All reports | A page header followed by every report, newest first |
| Testimonials | A photo beside one or more customer quotes |
| Team | A title above team member photos |
| Advisers | A title above a list of advisers |
| Call to action banner | A tall background image with a headline and a button |

Things worth knowing:

- **The home page** is the page called `index`. Don't rename or delete it.
- **The reports index** is the page called `report`. Renaming it changes its address.
- **The site header sits on top of the first section**, in white. Start every page with a dark section (a Hero, an All reports header or a Call to action banner) so the header stays readable.
- **Buttons, heading badges and partner logos are optional.** Remove one in the sidebar to hide it, and add it back the same way.
- **Each page has an "SEO and social sharing" group** in the sidebar, for the title and description that search engines and social networks show.

### Adding a page

Choose **Add > Page** in the Pages list and give it a name. The name becomes the page's address: "Spring Campaign" is published at `/spring-campaign/`. A new page previews on top of the home page's header and footer until the site has been rebuilt with it.

## Reports

Each report has a title, an author, a published date, a cover image and the body text. Open a report to edit the text in place, or switch to the content editor for a distraction-free view.

- **New reports** appear on the reports index automatically, newest first. To feature one on the home page, edit the home page's **Featured reports** section and pick it from the list.
- **Adding a report:** choose **Add > Report** in the Reports list. A new report is previewed using the layout of the "Clarity over complexity" report until the site has been rebuilt. If that report is ever deleted or renamed, new reports will have no preview - tell your developer so a different one can be chosen.
- **Images inside the body text** are uploaded as they are. Resize large photos before uploading them.

## Site settings

| File | What it controls |
| --- | --- |
| Site | The logo, the brand colour, and the fixed labels on report pages ("Report", "Author", "Return to all reports") |
| Navigation | The links in the header, the mobile menu and the footer, and the button at the top right |
| Footer | The company heading and description, phone number, email address, copyright line and the legal links at the very bottom |

Changes here apply to every page.

## Images

Photos used in sections and on reports are resized and compressed automatically. Logos and icons should be SVG files.

## Translations

The site is written in English and published in Spanish as well, at `/es/`. You never create a Spanish page: every English page gets a Spanish copy when the site is built, and you translate its text.

**On the page.** Open any page or report in the visual editor. A round language button floats in a corner of the preview. Choose **Español** and the page switches to Spanish; click a text and type its translation. Choose the original language again to go back to editing the English text.

- A text you have not translated yet shows in English on the Spanish site.
- When someone changes an English text after it was translated, the Spanish text gets a dashed amber outline. Update the translation, or mark it as reviewed if it is still right.
- The header and footer are translated once, from any page.
- A report's body is one translation: the whole text, with its headings and links.
- New sections, list items and navigation links can be translated after the next build has finished.

**In the Translations list.** Some text is not visible on a page, such as the SEO title and description. Open [Translations](cloudcannon:collections/locales), then **es**, and find the entry by its name: it starts with the page (`index` is the home page, `report/...` is a report) and ends with the field (`page_title`, `page_description`). Type the Spanish text in **Translation**.

People's names, partner names, the phone number and the email address are the same in both languages and are not in the list.
