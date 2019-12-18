@Library('pipeline@feature/bls/new_libs') _

def version = '20.1000'

node ('controls') {
    checkout_pipeline("20.1000/feature/bls/new_libs_ui_v17")
    run_branch = load '/home/sbis/jenkins_pipeline/platforma/branch/run_branch'
    run_branch.execute('ui', version)
}