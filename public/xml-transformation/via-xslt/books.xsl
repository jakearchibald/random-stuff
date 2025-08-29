<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" indent="yes" doctype-public="-//W3C//DTD HTML 4.01//EN"
    doctype-system="http://www.w3.org/TR/html4/strict.dtd" />

  <xsl:template name="book">
    <div>
      <span class="title">
        <xsl:value-of select="title" />
      </span> - <span class="author">
        <xsl:value-of select="../name" />
      </span>
    </div>

    <div>
      <span class="genre"> Genre: <xsl:value-of select="genre" /></span>
    </div>
  </xsl:template>

  <xsl:template match="/">
    <html>
      <head>
        <title>Book Collection</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="styles.css" />
      </head>
      <body>
        <h1>Book Collection</h1>
        <ul>
          <xsl:for-each select="authors/author/book">
            <li>
              <xsl:call-template name="book" />
            </li>
          </xsl:for-each>
        </ul>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
