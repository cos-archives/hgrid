__author__ = 'Alexander'

@app.route('/diff_drag_files', methods=['GET','POST'])
def diff_drag_files():
    if len(lst_dff)==2 and not lst_dff.__contains__('extension'):
        old_text = copy.deepcopy(lst_dff[0])
        new_text = copy.deepcopy(lst_dff[1])
        del lst_dff[:]
        d = diff_match_patch()
        s = d.diff_main(old_text, new_text)
        s = d.diff_prettyHtml(s)
        return render_template("diff_files.html",
                               old_text = old_text,
                               new_text = new_text,
                               changes = s)
    ext_error = "One of your files was not found or has an invalid extension type."
    del lst_dff[:]
    return render_template("404.html",
                           s = ext_error), 404

@app.route('/dealer', methods=['GET', 'POST'])
def dealer():
    if request.files['file'] and allowed_file(request.files['file'].filename):
        s = request.files['file'].stream.read()
        lst_dff.append(s)
    elif not allowed_file(request.files['file'].filename):
        lst_dff.append('extension')
    return ''

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS