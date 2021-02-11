@Library('pipeline') _

def version = '21.2000'

node ('controls') {
    checkout_pipeline("21.2000/feature/add_builder_units2ui_branch")
    run_branch = load '/home/sbis/jenkins_pipeline/platforma/branch/run_branch'
    run_branch.execute('ui', version)
}