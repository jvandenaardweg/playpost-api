# Script that parses a webpage and returns information about that page
# We also strip the HTML as much so we can generate a SSML file from the article contents

from newspaper import Article
from flask import jsonify
from bs4 import BeautifulSoup
import json
import requests
import re

def parse_article(request):
	language = request.args.get('lang') or 'en'
	url = request.args.get('url') or ''
	html = request.args.get('html') or ''

	if html:
		print('Parsing HTML, using url "',url,'", language "',language,'"')

		# When we have the HTML, we just want to parse that (for example, html from a page that requires authentication)
		article = Article(url, keep_article_html=True, language=language)
		article.download(input_html=html)

		return _return_article(article)
	elif url:
		print('Getting URL, using url "',url,'", language "',language,'"')

		# If we have an URL we just get that page
		article = Article(url, keep_article_html=True, language=language)
		article.download()

		return _return_article(article)
	else:
		return 'No URL or HTML parameter given. If you give an HTML parameter, you must include an URL parameter.'

def _remove_all_empty_tags(soup):
	for x in soup.find_all():
		if len(x.text) == 0:
			x.extract()
	return soup

def _remove_specific_enclosed_tags(soup, removelist):
	for remove_tag in removelist:
		for tag in soup.find_all(remove_tag):
			tag.decompose()
	return soup

def _remove_all_attrs(soup):
	# Credits: https://gist.github.com/revotu/21d52bd20a073546983985ba3bf55deb
	for tag in soup.find_all(True):
		tag.attrs = {}
	return soup

def _replace_with_quotes(soup, replacelist):
	for replace_tag in replacelist:
		for tag in soup.find_all(replace_tag):
			tag.replace_with('"%s"' % tag.string)
	return soup

def _clean_html_for_speech(html):
	# Removes attributes from HTML tags and white space before that, so we end up with <p> for example and not <p class="test">
	# html = re.sub("\s(\S+)\s*=\s*[\"']?((?:.(?![\"']?\s+(?:\S+)=|[>\"']))?[^\"']*)[\"']?", "", html)

	soup = BeautifulSoup(html, 'lxml')
	clean_soup = _remove_all_attrs(soup) # Removes all HTML-tag attributees, so we end up with <p> for example and not <p class="test">
	# clean_soup = _remove_specific_tags(clean_soup, ['img']) # Removes all <img> tags, since they usually contain content we cannot "speak"
	clean_soup = _remove_all_empty_tags(clean_soup) # Removes all empty HTML-tags, like <p></p>
	clean_soup = _remove_specific_enclosed_tags(clean_soup, ['pre', 'h1']) # Removes all enclosed tags, like <pre></pre>, sine they usually contain content we cannot "speak"
	clean_soup = _replace_with_quotes(clean_soup, ['a']) # Since <a> elements cannot be followed, we "quote" the text inside of it #TODO: maybe not do this? Might sound weird

	return str(clean_soup.body)

def _return_article(article):
	article.parse()
	speech_html = _clean_html_for_speech(article.article_html)

	article_json = {
		'title': article.title,
		'url': article.url,
		'text': article.text,
		'authors': article.authors,
		'article_html': article.article_html,
		'html': article.html,
		'top_image': article.top_image,
		'publish_date': article.publish_date,
		'meta_lang': article.meta_lang,
		'meta_description': article.meta_description,
		'meta_data': article.meta_data,
		'canonical_link': article.canonical_link,
		'speech_html': speech_html
	}
	return jsonify(article_json)