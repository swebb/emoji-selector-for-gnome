//this file is part of https://github.com/maoschanz/emoji-selector-for-gnome

const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;

/* Import the current extension, mainly because we need to access other files */
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const SkinTonesBar = Me.imports.emojiOptionsBar.SkinTonesBar;
const Extension = Me.imports.extension;
const EmojiButton = Me.imports.emojiButton;

var EmojiCategory = class EmojiCategory {

	/**
	 * The category and its button have to be built without being loaded, to
	 * memory issues with emojis' image textures.
	 */
	constructor(categoryName, iconName, skinToneSelectable, genderSelectable, id) {
		this.super_item = new PopupMenu.PopupSubMenuMenuItem(categoryName);
		this.categoryName = categoryName;
		this.id = id;

		this.super_item.actor.visible = false;
		this.super_item.actor.reactive = false;
		this.super_item._triangleBin.visible = false;

		this.emojiButtons = []; // used for searching, and for updating the size/style

		// These options bar widgets have the same type for all categories to
		// simplify the update method
		if (genderSelectable) {
			this.skinTonesBar = new SkinTonesBar(true);
		} else {
			this.skinTonesBar = new SkinTonesBar(false);
		}

		//   Smileys & body   Peoples           Activities
		if (skinToneSelectable || genderSelectable) {
			this.skinTonesBar.addBar(this.super_item.actor);
		}

		var child;
		if (iconName.startsWith("emoji-") || iconName.startsWith("face-")) {
		  child = new St.Icon({
		    icon_name: iconName,
		    icon_size: 16
		  })
		} else {
		  child = new St.Label({
		    text: iconName
		  })
		}
		this.categoryButton = new St.Button({
			reactive: true,
			can_focus: true,
			track_hover: true,
			toggle_mode: true,
			accessible_name: categoryName,
			style_class: 'EmojisCategory',
			child: child,
			x_expand: true,
			x_align: Clutter.ActorAlign.CENTER,
		});
		this.categoryButton.connect('clicked', this._toggle.bind(this));

		this._built = false; // will be true once the user opens the category
	}

	_addErrorLine(error_message) {
		log(error_message);
		let line = new PopupMenu.PopupBaseMenuItem({
			reactive: false,
			can_focus: false,
		});
		line.actor.add_child(new St.Label({
			text: error_message
		}));
		this.super_item.menu.addMenuItem(line);
	}

	addEmoji(character, keywords) {
		let button = new EmojiButton.EmojiButton(character, keywords);
		this.emojiButtons.push(button);
	}

	clear() {
		this.super_item.menu.removeAll();
		this.emojiButtons = [];
	}

	searchEmoji(searchedText, neededresults, priority) {
		let searchResults = [];
		for (let i = 0; i < this.emojiButtons.length; i++) {
			if (neededresults >= 0) {
				let isMatching = false;
				if (priority === 3) {
					isMatching = this._searchExactMatch(searchedText, i);
				} else if (priority === 2) {
					isMatching = this._searchInName(searchedText, i);
				} else {
					isMatching = this._searchInKeywords(searchedText, i);
				}
				if (isMatching){
					searchResults.push(this.emojiButtons[i].baseCharacter)
					neededresults--;
				}
			}
		}
		return searchResults
	}

	_searchExactMatch(searchedText, i) {
		return this.emojiButtons[i].keywords[0] === searchedText;
	}

	_searchInName(searchedText, i) {
		if (this.emojiButtons[i].keywords.includes(searchedText)) {
			// If the name corresponds to the searched string, but it is also an
			// exact match, we can assume the emoji is already in the displayed
			// result.
			return !this._searchExactMatch(searchedText, i);
		}
		return false;
	}

	_searchInKeywords(searchedText, i) {
		for (let k = 0; k < this.emojiButtons[i].keywords.length; k++) {
			if (this.emojiButtons[i].keywords[k].includes(searchedText)) {
				// If a keyword corresponds to the searched string, but the name
				// corresponds too, we can assume the emoji is already in the
				// displayed result.
				return !( this._searchExactMatch(searchedText, i)
				                       || this._searchInName(searchedText, i) );
			}
		}
		return false;
	}

	/**
	 * Builds the submenu, and fill it with containers full of previously built
	 * EmojiButtons objects.
	 */
	build() {
		if (this._built) { return; }
		let ln, container;
		for (let i=0; i<this.emojiButtons.length; i++) {
			// lines of emojis
			if (i % Extension.NB_COLS === 0) {
				ln = new PopupMenu.PopupBaseMenuItem({
					style_class: 'EmojisList',
					reactive: false,
					can_focus: false,
				});
				ln.actor.track_hover = false;
				container = new St.BoxLayout();
				ln.actor.add_child(container);
				this.super_item.menu.addMenuItem(ln);
			}
			this.emojiButtons[i].build(this);
			container.add_child(this.emojiButtons[i].super_btn);
		}
		this._built = true;
	}

//	unload() { // TODO ?
//		this._built = false;
//		this._loaded = false;
//		for (let i=0; i<this.emojiButtons.length; i++) {
//			this.emojiButtons[i].destroy();
//		}
//		this.super_item.menu.removeAll();
//		this.emojiButtons = [];
//	}

	_toggle() {
		if (this.super_item._getOpenState()) {
			Extension.GLOBAL_BUTTON.clearCategories();
		} else {
			this._openCategory();
		}
	}

	_openCategory() {
		Extension.GLOBAL_BUTTON.clearCategories();
		this.super_item.label.text = this.categoryName;

		if(!this._built) this.build();

		this.skinTonesBar.update();

		this.categoryButton.set_checked(true);
		this.super_item.actor.visible = true;
		this.super_item.setSubmenuShown(true);
		Extension.GLOBAL_BUTTON._activeCat = this.id;
		Extension.GLOBAL_BUTTON._onSearchTextChanged();
	}

	getButton() {
		return this.categoryButton;
	}
}

