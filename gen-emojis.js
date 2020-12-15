#!/bin/env nodejs

const fs = require('fs');
const emojis = require("emoji-datasource/emoji.json")


const extractEmojiData = emoji => {
  return {
    name: emoji.name,
    short_name: emoji.short_name,
    short_names: emoji.short_names,
    unified: emoji.unified,
    non_qualified: emoji.non_qualified,
    category: emoji.category,
    sort_order: emoji.sort_order,
    skin_variations: extractSkinVariations(emoji),
  }
}

const compareSortOrder = (a,b) => {
	if ( a.sort_order < b.sort_order ){
		return -1;
	}
	if ( a.sort_order > b.sort_order ){
		return 1;
	}
	return 0;
}

const extractSkinVariations = emoji => {
  if (emoji.skin_variations) {
    var res = {}
    Object.entries(emoji.skin_variations).forEach(entry => {
      const [key, value] = entry
      res[key] = value.unified
    })
    return res
  }
}


const filtered_emojis = emojis.sort(compareSortOrder).map(extractEmojiData)
fs.writeFileSync('emoji-selector@maestroschan.fr/data/emoji.js', "var ALL = " + JSON.stringify(filtered_emojis, null, 2));
console.log("Wrote emoji data to: emoji-selector@maestroschan.fr/data/emoji.js")

