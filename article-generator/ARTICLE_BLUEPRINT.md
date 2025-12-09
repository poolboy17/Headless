# Article Blueprint: Product Splash Page

This blueprint shows the exact structure and formatting for generated tour articles.

---

## Example Tour Data
```
Title: Ghosts and Toasts: Haunted Non-Alcoholic Pub Crawl
Destination: Savannah
Price: $35.00 USD
Duration: 2 hours
Rating: 4.9/5 (847 reviews)
Free Cancellation: Yes
Booking URL: https://www.viator.com/tours/Savannah/Ghosts-and-Toasts-Haunted-Non-Alcoholic-Pub-Crawl/d5166-74147P8?pid=P00166886&medium=api
```

---

## Generated Article Structure

### 1. JSON-LD Schema (Hidden in HTML)
```html
<!-- wp:html -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      "name": "Ghosts and Toasts: Haunted Non-Alcoholic Pub Crawl",
      "description": "Experience Savannah's haunted history...",
      "offers": {
        "@type": "Offer",
        "price": 35.00,
        "priceCurrency": "USD",
        "url": "https://www.viator.com/tours/Savannah/..."
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 4.9,
        "reviewCount": 847
      }
    },
    {
      "@type": "TouristTrip",
      "name": "Ghosts and Toasts: Haunted Non-Alcoholic Pub Crawl",
      "touristType": ["Ghost Tour Enthusiasts", "History Buffs"]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [...]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [...]
    }
  ]
}
</script>
<!-- /wp:html -->
```

---

### 2. Featured Snippet Hook (First 50 words)
```html
<!-- wp:paragraph -->
<p>Ghosts and Toasts: Haunted Non-Alcoholic Pub Crawl is a 2-hour walking tour in Savannah that combines the city's legendary ghost stories with visits to historic pubs, offering a family-friendly paranormal experience through America's most haunted city.</p>
<!-- /wp:paragraph -->
```

---

### 3. Atmospheric Introduction (150-200 words)
```html
<!-- wp:paragraph -->
<p>As twilight descends over Savannah's cobblestone streets, the city transforms. Gas lamps flicker to life along the moss-draped squares, and shadows seem to move just beyond the corner of your eye. Visitors report feeling sudden cold spots near the old colonial buildings, and our research into Savannah's paranormal activity confirms what locals have known for centuries—this city never truly lets go of its dead.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Ghosts and Toasts tour takes you through the heart of Savannah's Historic District, where centuries of tragedy, plague, and violence have left an indelible spiritual imprint. From the infamous Marshall House—still operating as a hotel despite its history as a Civil War hospital—to the haunted taverns where spectral patrons are said to still order drinks, every stop on this tour has a story that will raise the hair on the back of your neck.</p>
<!-- /wp:paragraph -->
```

---

### 4. The Haunted History of [Location] (250-300 words)
```html
<!-- wp:heading {"level":2} -->
<h2>The Haunted History of Savannah</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Founded in 1733 by General James Oglethorpe, Savannah has accumulated nearly three centuries of tragedy. The city survived multiple yellow fever epidemics—the 1820 outbreak alone claimed over 700 lives, with bodies stacked in the streets faster than they could be buried. According to historical records from the Georgia Historical Society, many victims were interred in mass graves beneath what are now busy intersections and public squares.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Civil War transformed Savannah into a city of the wounded and dying. The Marshall House Hotel served as a Union hospital where surgeons performed amputations around the clock. During renovations in 1999, workers discovered human bones and surgical implements beneath the floorboards—remnants of the limbs discarded during those desperate wartime operations.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Lesser known is Savannah's role in the colonial slave trade. The city's wealth was built on human suffering, and paranormal investigators have documented unexplained phenomena at sites connected to this dark chapter. The Sorrel-Weed House, which you'll pass on this tour, has been featured on Ghost Hunters and is considered one of the most actively haunted locations in North America.</p>
<!-- /wp:paragraph -->
```

---

### 5. What to Expect on This Tour (200-250 words)
```html
<!-- wp:heading {"level":2} -->
<h2>What to Expect on the Ghosts and Toasts Tour</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>What happens on this tour goes beyond typical ghost storytelling. Your guide—trained in both Savannah history and paranormal investigation techniques—leads you through dimly lit streets while sharing documented encounters and historical evidence of supernatural activity.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Tour Highlights</h3>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
<li>Visit 4-5 historic pubs with documented paranormal activity</li>
<li>Hear first-hand accounts from bar staff about ghostly encounters</li>
<li>Learn EMF detection techniques used by professional investigators</li>
<li>Explore Savannah's most haunted squares after dark</li>
<li>Receive non-alcoholic beverages at select stops (family-friendly)</li>
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Is the tour scary? The atmosphere is certainly eerie, but the experience focuses more on historical storytelling than jump scares. Guests frequently report feeling "watched" or experiencing unexplained cold spots, particularly near the Moon River Brewing Company—widely considered Savannah's most haunted building.</p>
<!-- /wp:paragraph -->
```

---

### 6. Who Is This Tour Best For? (150-200 words)
```html
<!-- wp:heading {"level":2} -->
<h2>Who Is This Savannah Ghost Tour Best For?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Best for:</strong> History enthusiasts, paranormal curious visitors, families with older children (10+), couples seeking unique date nights, and anyone who wants to experience Savannah beyond the typical tourist trail.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Great choice if you:</strong> Prefer walking tours over bus tours, enjoy storytelling and local legends, want to visit historic pubs without alcohol pressure, or are fascinated by the intersection of documented history and unexplained phenomena.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Consider alternatives if:</strong> You have mobility limitations (tour covers 1+ miles on foot), prefer daytime activities, or are looking for a pub crawl focused on drinking rather than history.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>See our complete guide to <em>Savannah ghost tours</em> for more options in this haunted city.</p>
<!-- /wp:paragraph -->
```

---

### 7. Tour Details at a Glance
```html
<!-- wp:heading {"level":2} -->
<h2>Ghosts and Toasts Tour Details</h2>
<!-- /wp:heading -->

<!-- wp:table -->
<figure class="wp-block-table"><table><tbody>
<tr><td><strong>Duration</strong></td><td>2 hours</td></tr>
<tr><td><strong>Price</strong></td><td>From $35.00 per person</td></tr>
<tr><td><strong>Cancellation Policy</strong></td><td>Free cancellation up to 24 hours before</td></tr>
<tr><td><strong>Confirmation</strong></td><td>Instant confirmation</td></tr>
<tr><td><strong>Meeting Point</strong></td><td>Reynolds Square, Savannah Historic District</td></tr>
<tr><td><strong>Group Size</strong></td><td>Maximum 15 guests</td></tr>
<tr><td><strong>Languages</strong></td><td>English</td></tr>
</tbody></table></figure>
<!-- /wp:table -->
```

---

### 8. Frequently Asked Questions (6-8 FAQs with H3 headers)
```html
<!-- wp:heading {"level":2} -->
<h2>Frequently Asked Questions About Ghosts and Toasts</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3>Is the Ghosts and Toasts tour scary?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>The Ghosts and Toasts tour is more atmospheric than frightening. While the stories involve death and tragedy, guides focus on historical accuracy rather than theatrical scares. Most guests describe it as "delightfully spooky" rather than terrifying.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Is this Savannah ghost tour suitable for children?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>This tour is suitable for children ages 10 and up. The content discusses historical deaths and paranormal activity, which may be too intense for younger children. The non-alcoholic format makes it ideal for families with older kids.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>What should I wear on the Ghosts and Toasts tour?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Wear comfortable walking shoes—you'll cover over a mile on Savannah's uneven cobblestone streets. Dress for the weather, and bring a light jacket even in summer, as some guests report unexplained cold spots during the tour.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Can I take photos on the ghost tour?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Photography is encouraged on the Ghosts and Toasts tour. Many guests have captured unexplained orbs or anomalies in their photos, particularly at the Moon River Brewing Company. Your guide will point out the best spots for paranormal photography.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>How much walking is involved?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>The tour covers approximately 1.2 miles over 2 hours at a leisurely pace. There are frequent stops at pubs and historic sites. Those with mobility concerns should contact the tour operator in advance.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>What if it rains during the tour?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>The Ghosts and Toasts tour runs rain or shine—some say the spirits are more active during storms. In heavy rain, more time is spent inside the historic pubs. Free cancellation is available up to 24 hours before if you prefer to reschedule.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Are the ghosts at Moon River Brewing Company real?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Moon River Brewing Company is considered one of America's most haunted buildings, featured on Ghost Hunters and Ghost Adventures. Staff and visitors have reported apparitions, objects moving, and aggressive encounters on the upper floors. Whether the ghosts are "real" is for you to decide after your visit.</p>
<!-- /wp:paragraph -->
```

---

### 9. The Bottom Line (100-150 words + CTA Button)
```html
<!-- wp:heading {"level":2} -->
<h2>The Bottom Line</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Ghosts and Toasts tour stands out as one of Savannah's best paranormal experiences. With a 4.9-star rating from over 847 verified reviews, it consistently delivers on its promise of authentic ghost stories, historical depth, and genuinely eerie atmosphere. The non-alcoholic format makes it accessible to all ages while still visiting the city's most haunted taverns.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For anyone visiting Savannah who wants to experience the city's supernatural side, this tour offers the perfect blend of education and entertainment. The free cancellation policy means you can book with confidence.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"vivid-red","textColor":"white","style":{"typography":{"fontSize":"20px"}}} -->
<div class="wp-block-button has-custom-font-size" style="font-size:20px"><a class="wp-block-button__link has-white-color has-vivid-red-background-color has-text-color has-background wp-element-button" href="https://www.viator.com/tours/Savannah/Ghosts-and-Toasts-Haunted-Non-Alcoholic-Pub-Crawl/d5166-74147P8?pid=P00166886&medium=api">Book This Haunted Tour Now</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
```

---

### 10. Related Experiences
```html
<!-- wp:heading {"level":2} -->
<h2>Related Haunted Experiences</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
<li><strong>Other ghost tours in Savannah:</strong> Explore our complete guide to Savannah's paranormal tours</li>
<li><strong>Haunted pub crawls:</strong> Compare similar experiences across America</li>
<li><strong>Savannah cemetery tours:</strong> Visit the legendary Bonaventure Cemetery</li>
</ul>
<!-- /wp:list -->
```

---

### 11. SEO Meta Elements (End of Content)
```html
<!-- META: Discover Savannah's haunted history on the Ghosts and Toasts tour. 2-hour walking tour visiting haunted pubs with 4.9-star rating. Book now! -->

<!-- FOCUS_KEYPHRASE: Savannah ghost tour -->

<!-- SECONDARY_KEYWORDS: haunted Savannah tour, Savannah pub crawl, ghost tours Savannah GA, Moon River Brewing ghost -->

<!-- INTERNAL_LINKS: /destinations/savannah/, /guides/best-ghost-tours-america/, /tours/savannah-cemetery-tours/ -->
```

---

## Content Metrics

| Metric | Target | Example |
|--------|--------|---------|
| Total Word Count | 1500-1800 | ~1650 |
| FAQ Count | 6-8 | 7 |
| H2 Headings | 6-8 | 7 |
| H3 Headings (FAQs) | 6-8 | 7 |
| Destination in H2s | 3+ | 4 |
| Tour Name Mentions | 4-6 | 5 |
| Schema Types | 4-5 | 5 (@graph) |
| CTA Buttons | 1 | 1 |

---

## File Structure Summary

```
Generated Article
├── JSON-LD Schema Block (hidden)
│   ├── Product
│   ├── TouristTrip
│   ├── TouristAttraction
│   ├── Event
│   ├── FAQPage
│   └── BreadcrumbList
├── Featured Snippet Hook
├── Atmospheric Introduction
├── Haunted History of [Location] (H2)
├── What to Expect (H2)
│   └── Tour Highlights (H3 + bullet list)
├── Who Is This Tour Best For? (H2)
├── Tour Details at a Glance (H2 + table)
├── FAQs (H2)
│   ├── FAQ 1 (H3)
│   ├── FAQ 2 (H3)
│   ├── ... (H3)
│   └── FAQ 7 (H3)
├── The Bottom Line (H2)
│   └── CTA Button → Viator Booking URL
├── Related Experiences (H2)
└── Meta Comments (hidden)
    ├── META
    ├── FOCUS_KEYPHRASE
    ├── SECONDARY_KEYWORDS
    └── INTERNAL_LINKS
```
